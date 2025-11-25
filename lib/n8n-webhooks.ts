/**
 * N8N Webhook Client
 * Handles all calls from Rockola to n8n webhooks
 * Includes comprehensive logging and error handling
 */

import crypto from 'crypto';
import env from './env';
import { logger } from './logger';

interface N8NWebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

/**
 * Calculate HMAC-SHA256 signature for webhook security
 */
function calculateSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(body).digest('hex');
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
  const bodyString = JSON.stringify(body);
  const signature = calculateSignature(bodyString, env.n8n.webhookSecret);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': env.n8n.apiKey,
    'X-Signature': signature,
  };

  try {
    logger.info(`Calling n8n webhook: ${webhookName}`, {
      type: 'n8n_webhook_call_start',
      webhook: webhookName,
      url,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString,
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

  const response = await callN8NWebhook<{
    playlistId: string;
    playlistUrl: string;
    playlistName: string;
  }>('create-playlist', env.n8n.webhooks.createPlaylist, {
    venueId,
    venueName,
    spotifyClientId,
    spotifyClientSecret,
  });

  if (response.success && response.playlistId) {
    logger.venueOperation('playlist_created', venueId, 'PLAYLIST', {
      playlistId: response.playlistId,
      playlistUrl: response.playlistUrl,
    });

    return {
      success: true,
      playlistId: response.playlistId,
      playlistUrl: response.playlistUrl,
      playlistName: response.playlistName,
    };
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
