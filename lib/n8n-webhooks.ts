/**
 * N8N Webhook Client
 * Handles all calls from Rockola to n8n webhooks
 * Includes comprehensive logging and error handling
 */

import jwt from 'jsonwebtoken';
import env from './env';
import { logger } from './logger';

interface N8NWebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

/**
 * Generate JWT token for n8n webhook authentication
 * Uses JWT with HS256 (HMAC-SHA256) algorithm
 * Payload contains webhook data, automatically verified by n8n
 */
function generateJWT(body: any, secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  
  // JWT payload contains the webhook data as claims
  const payload = {
    ...body,
    iat: now, // Issued at
    exp: now + (5 * 60), // Expires in 5 minutes (prevents replay attacks)
  };
  
  // Sign with HS256 (HMAC-SHA256) - same algorithm n8n uses
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

/**
 * Make authenticated request to n8n webhook
 */
async function callN8NWebhook<T = any>(
  webhookName: string,
  url: string,
  body: any
): Promise<N8NWebhookResponse<T>> {
  const startTime = Date.now();
  
  // Validate webhook secret is configured
  if (!env.n8n.webhookSecret) {
    logger.error('N8N_WEBHOOK_SECRET not configured', {
      type: 'n8n_webhook_error',
      error: 'N8N_WEBHOOK_SECRET must be set in .env',
    });
    return {
      success: false,
      error: 'N8N_WEBHOOK_SECRET not configured. Please set it in .env file.',
    };
  }
  
  // Generate JWT token with webhook payload
  // n8n will automatically verify the JWT signature and expiration
  const token = generateJWT(body, env.n8n.webhookSecret);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    logger.info(`Calling n8n webhook: ${webhookName}`, {
      type: 'n8n_webhook_call_start',
      webhook: webhookName,
      url,
    });

    // With JWT, we don't send body separately - payload is in JWT token
    // But n8n might still expect body, so we'll send both for compatibility
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body), // Send body for n8n to access via $json.body
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    let responseData: any;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      const error = {
        status: response.status,
        statusText: response.statusText,
        message: responseData.error || responseText,
      };

      logger.n8nWebhookCall(webhookName, url, body, undefined, error);

      return {
        success: false,
        error: error.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    logger.n8nWebhookCall(webhookName, url, body, {
      ...responseData,
      status: response.status,
      responseTime: `${responseTime}ms`,
    });

    return {
      success: true,
      ...responseData,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    logger.n8nWebhookCall(webhookName, url, body, undefined, {
      message: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
    });

    return {
      success: false,
      error: error.message || 'Failed to call n8n webhook',
    };
  }
}

/**
 * Create Playlist (Playlist Mode)
 */
export async function createPlaylist(
  venueId: string,
  venueName: string,
  spotifyClientId: string,
  spotifyClientSecret: string
): Promise<{
  success: boolean;
  playlistId?: string;
  playlistUrl?: string;
  playlistName?: string;
  error?: string;
}> {
  logger.venueOperation('create_playlist', venueId, 'PLAYLIST', {
    venueName,
  });

  // n8n returns the raw Spotify API response, so we need to handle both formats:
  // 1. Formatted response: { playlistId, playlistUrl, playlistName }
  // 2. Raw Spotify API response: { id, external_urls: { spotify }, name, ... }
  const response = await callN8NWebhook<any>('create-playlist', env.n8n.webhooks.createPlaylist, {
    venueId,
    venueName,
    spotifyClientId,
    spotifyClientSecret,
  });

  if (response.success) {
    // Handle formatted response (if n8n formats it)
    let playlistId: string | undefined;
    let playlistUrl: string | undefined;
    let playlistName: string | undefined;

    if (response.playlistId) {
      // Formatted response format
      playlistId = response.playlistId;
      playlistUrl = response.playlistUrl;
      playlistName = response.playlistName;
    } else if (response.id) {
      // Raw Spotify API response format
      playlistId = response.id;
      playlistUrl = response.external_urls?.spotify || response.href;
      playlistName = response.name;
    }

    if (playlistId) {
      logger.venueOperation('playlist_created', venueId, 'PLAYLIST', {
        playlistId,
        playlistUrl,
        playlistName,
      });

      return {
        success: true,
        playlistId,
        playlistUrl: playlistUrl || undefined,
        playlistName: playlistName || undefined,
      };
    }
  }

  return {
    success: false,
    error: response.error || 'Failed to create playlist',
  };
}

/**
 * Validate Rules (Playlist Advanced / Automation Mode)
 */
export async function validateRules(
  venueId: string,
  rules: any[]
): Promise<{
  success: boolean;
  valid?: boolean;
  conflicts?: Array<{
    rule1: string;
    rule2: string;
    conflict: string;
  }>;
  suggestions?: string[];
  error?: string;
}> {
  logger.info('Validating rules', {
    type: 'rules_validation',
    venueId,
    ruleCount: rules.length,
  });

  const response = await callN8NWebhook<{
    valid: boolean;
    conflicts?: Array<{
      rule1: string;
      rule2: string;
      conflict: string;
    }>;
    suggestions?: string[];
  }>('validate-rules', env.n8n.webhooks.validateRules, {
    venueId,
    rules,
  });

  if (response.success) {
    logger.info('Rules validation completed', {
      type: 'rules_validation_result',
      venueId,
      valid: response.valid,
      conflictCount: response.conflicts?.length || 0,
    });

    return {
      success: true,
      valid: response.valid,
      conflicts: response.conflicts,
      suggestions: response.suggestions,
    };
  }

  return {
    success: false,
    error: response.error || 'Failed to validate rules',
  };
}

/**
 * Add Song to Playlist (Playlist Mode)
 */
export async function addSongToPlaylist(
  venueId: string,
  requestId: string,
  playlistId: string,
  trackUri: string,
  spotifyClientId: string,
  spotifyClientSecret: string
): Promise<{
  success: boolean;
  added?: boolean;
  playlistLength?: number;
  error?: string;
}> {
  logger.songRequest('add_to_playlist', requestId, venueId, 'PENDING', {
    playlistId,
    trackUri,
  });

  const response = await callN8NWebhook<{
    added: boolean;
    playlistLength: number;
  }>('add-song-to-playlist', env.n8n.webhooks.addSongToPlaylist, {
    venueId,
    requestId,
    playlistId,
    trackUri,
    spotifyClientId,
    spotifyClientSecret,
  });

  if (response.success && response.added) {
    logger.songRequest('added_to_playlist', requestId, venueId, 'QUEUED', {
      playlistLength: response.playlistLength,
    });

    return {
      success: true,
      added: true,
      playlistLength: response.playlistLength,
    };
  }

  return {
    success: false,
    error: response.error || 'Failed to add song to playlist',
  };
}

/**
 * Search Track (All Modes)
 */
export async function searchTrack(
  venueId: string,
  requestId: string,
  trackName: string,
  artistName: string,
  spotifyClientId: string,
  spotifyClientSecret: string
): Promise<{
  success: boolean;
  track?: {
    spotifyTrackId: string;
    trackUri: string;
    trackName: string;
    artistName: string;
    albumName?: string;
    duration: number;
    explicit: boolean;
    previewUrl?: string;
  };
  message?: string;
  error?: string;
}> {
  logger.songRequest('search_track', requestId, venueId, 'PENDING', {
    trackName,
    artistName,
  });

  const response = await callN8NWebhook<{
    track: {
      spotifyTrackId: string;
      trackUri: string;
      trackName: string;
      artistName: string;
      albumName?: string;
      duration: number;
      explicit: boolean;
      previewUrl?: string;
    } | null;
    message?: string;
  }>('search-track', env.n8n.webhooks.searchTrack, {
    venueId,
    requestId,
    trackName,
    artistName,
    spotifyClientId,
    spotifyClientSecret,
  });

  if (response.success) {
    if (response.track) {
      logger.songRequest('track_found', requestId, venueId, 'PENDING', {
        spotifyTrackId: response.track.spotifyTrackId,
      });

      return {
        success: true,
        track: response.track,
      };
    } else {
      logger.songRequest('track_not_found', requestId, venueId, 'FAILED', {
        message: response.message,
      });

      return {
        success: true,
        message: response.message || 'Track not found on Spotify',
      };
    }
  }

  return {
    success: false,
    error: response.error || 'Failed to search track',
  };
}

/**
 * Add Song to Queue (Automation Mode)
 */
export async function addSongToQueue(
  venueId: string,
  requestId: string,
  trackUri: string,
  spotifyAccessToken: string,
  spotifyRefreshToken: string,
  deviceId?: string
): Promise<{
  success: boolean;
  queued?: boolean;
  queuePosition?: number;
  error?: string;
}> {
  logger.songRequest('add_to_queue', requestId, venueId, 'PENDING', {
    trackUri,
    deviceId,
  });

  const response = await callN8NWebhook<{
    queued: boolean;
    queuePosition: number;
  }>('add-song-to-queue', env.n8n.webhooks.addSongToQueue, {
    venueId,
    requestId,
    trackUri,
    deviceId,
    spotifyAccessToken,
    spotifyRefreshToken,
  });

  if (response.success && response.queued) {
    logger.songRequest('added_to_queue', requestId, venueId, 'QUEUED', {
      queuePosition: response.queuePosition,
    });

    return {
      success: true,
      queued: true,
      queuePosition: response.queuePosition,
    };
  }

  return {
    success: false,
    error: response.error || 'Failed to add song to queue',
  };
}

/**
 * Skip Track (Automation Mode)
 */
export async function skipTrack(
  venueId: string,
  requestId: string,
  reason: 'auto_moderation' | 'manual' | 'rule_violation',
  spotifyAccessToken: string,
  spotifyRefreshToken: string
): Promise<{
  success: boolean;
  skipped?: boolean;
  error?: string;
}> {
  logger.songRequest('skip_track', requestId, venueId, 'SKIPPED', {
    reason,
  });

  const response = await callN8NWebhook<{
    skipped: boolean;
  }>('skip-track', env.n8n.webhooks.skipTrack, {
    venueId,
    requestId,
    reason,
    spotifyAccessToken,
    spotifyRefreshToken,
  });

  if (response.success && response.skipped) {
    logger.songRequest('track_skipped', requestId, venueId, 'SKIPPED', {
      reason,
    });

    return {
      success: true,
      skipped: true,
    };
  }

  return {
    success: false,
    error: response.error || 'Failed to skip track',
  };
}
