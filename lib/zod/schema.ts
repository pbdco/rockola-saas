import { z } from 'zod';
import {
  apiKeyId,
  slug,
  email,
  password,
  token,
  role,
  sentViaEmail,
  domains,
  expiredToken,
  sessionId,
  recaptchaToken,
  priceId,
  quantity,
  memberId,
  inviteToken,
  url,
  endpointId,
  sentViaEmailString,
  invitationId,
  name,
  image,
  eventTypes,
  venueId,
} from './primitives';

export const createApiKeySchema = z.object({
  name: name(50),
});

export const deleteApiKeySchema = z.object({
  apiKeyId,
});

// Team schemas removed - teams feature has been removed from the application

const venueName = name();
const venueAddress = z
  .string({ invalid_type_error: 'Address must be a string' })
  .max(200)
  .optional()
  .transform((value) => value?.trim() || undefined);

const venueCurrency = z
  .string({ invalid_type_error: 'Currency must be a string' })
  .min(3)
  .max(10)
  .optional()
  .transform((value) => (value ? value.toUpperCase() : 'USD'));

const venuePrice = z
  .number({ invalid_type_error: 'Price per song must be a number' })
  .nonnegative()
  .max(1000)
  .nullable()
  .optional();

const baseVenueSchema = z.object({
  name: venueName,
  slug: slug.optional(),
  address: venueAddress,
  mode: z.enum(['PLAYLIST', 'AUTOMATION']).default('PLAYLIST'),
  requiresLocationCheck: z.boolean().optional().default(false),
  pricingEnabled: z.boolean().optional().default(false),
  pricePerSong: venuePrice,
  currency: venueCurrency,
  isActive: z.boolean().optional().default(true),
  spotifyClientId: z.string().optional(),
  spotifyClientSecret: z.string().optional(),
});

export const createVenueSchema = baseVenueSchema
  .refine((data) => {
    // Spotify credentials required only for Automation Mode
    if (data.mode === 'AUTOMATION') {
      return !!(data.spotifyClientId && data.spotifyClientSecret);
    }
    return true;
  }, {
    message: 'Spotify Client ID and Secret are required for Automation Mode',
    path: ['spotifyClientId'],
  })
  .refine((data) => {
    // If location check is required, address must be provided
    if (data.requiresLocationCheck) {
      return !!data.address;
    }
    return true;
  }, {
    message: 'Address is required when location check is enabled',
    path: ['address'],
  });

export const updateVenueSchema = baseVenueSchema.partial()
  .refine((data) => {
    // Spotify credentials required only for Automation Mode (if mode is being set to AUTOMATION)
    if (data.mode === 'AUTOMATION') {
      return !!(data.spotifyClientId && data.spotifyClientSecret);
    }
    return true;
  }, {
    message: 'Spotify Client ID and Secret are required for Automation Mode',
    path: ['spotifyClientId'],
  })
  .refine((data) => {
    // On update, if payload sets requiresLocationCheck true,
    // enforce that address is present in the same payload.
    if (data.requiresLocationCheck === true) {
      return !!data.address;
    }
    return true;
  }, {
    message: 'Address is required when location check is enabled',
    path: ['address'],
  });

export const venueIdSchema = z.object({
  venueId,
});

export const updateAccountSchema = z.union([
  z.object({
    email,
  }),
  z.object({
    name: name(),
  }),
  z.object({
    image,
  }),
]);

export const updatePasswordSchema = z.object({
  currentPassword: password,
  newPassword: password,
});

export const userJoinSchema = z.object({
  name: name(),
  email,
  password,
});

export const resetPasswordSchema = z.object({
  password,
  token,
});

export const inviteViaEmailSchema = z.union([
  z.object({
    email,
    role,
    sentViaEmail,
  }),
  z.object({
    role,
    sentViaEmail,
    domains,
  }),
]);

export const resendLinkRequestSchema = z.object({
  email,
  expiredToken,
});

export const deleteSessionSchema = z.object({
  id: sessionId,
});

export const forgotPasswordSchema = z.object({
  email,
  recaptchaToken: recaptchaToken.optional(),
});

export const resendEmailToken = z.object({
  email,
});

export const checkoutSessionSchema = z.object({
  price: priceId,
  quantity: quantity.optional(),
});

export const updateMemberSchema = z.object({
  role,
  memberId,
});

export const acceptInvitationSchema = z.object({
  inviteToken,
});

export const getInvitationSchema = z.object({
  token: inviteToken,
});

export const webhookEndpointSchema = z.object({
  name: name(),
  url,
  eventTypes,
});

export const updateWebhookEndpointSchema = webhookEndpointSchema.extend({
  endpointId,
});

export const getInvitationsSchema = z.object({
  sentViaEmail: sentViaEmailString,
});

export const deleteInvitationSchema = z.object({
  id: invitationId,
});

export const getWebhookSchema = z.object({
  endpointId,
});

export const deleteWebhookSchema = z.object({
  webhookId: endpointId,
});

export const deleteMemberSchema = z.object({
  memberId,
});

// SSO verification schema - simplified to use email only (teams removed)
export const ssoVerifySchema = z.object({
  email: email,
});
