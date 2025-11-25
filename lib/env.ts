import type { SessionStrategy } from 'next-auth';

const env = {
  databaseUrl: `${process.env.DATABASE_URL}`,
  appUrl: `${process.env.APP_URL}`,
  redirectIfAuthenticated: '/venues',
  securityHeadersEnabled: process.env.SECURITY_HEADERS_ENABLED ?? false,

  // SMTP configuration for NextAuth
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },

  // NextAuth configuration
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    sessionStrategy: (process.env.NEXTAUTH_SESSION_STRATEGY ||
      'jwt') as SessionStrategy,
  },

  // Svix
  svix: {
    url: `${process.env.SVIX_URL}`,
    apiKey: `${process.env.SVIX_API_KEY}`,
  },

  //Social login: Github
  github: {
    clientId: `${process.env.GITHUB_CLIENT_ID}`,
    clientSecret: `${process.env.GITHUB_CLIENT_SECRET}`,
  },

  //Social login: Google
  google: {
    clientId: `${process.env.GOOGLE_CLIENT_ID}`,
    clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
  },

  // Retraced configuration
  retraced: {
    url: process.env.RETRACED_URL
      ? `${process.env.RETRACED_URL}/auditlog`
      : undefined,
    apiKey: process.env.RETRACED_API_KEY,
    projectId: process.env.RETRACED_PROJECT_ID,
  },

  groupPrefix: process.env.GROUP_PREFIX,

  // SAML Jackson configuration
  jackson: {
    url: process.env.JACKSON_URL,
    externalUrl: process.env.JACKSON_EXTERNAL_URL || process.env.JACKSON_URL,
    apiKey: process.env.JACKSON_API_KEY,
    productId: process.env.JACKSON_PRODUCT_ID || 'boxyhq',
    selfHosted: process.env.JACKSON_URL !== undefined,
    sso: {
      callback: `${process.env.APP_URL}`,
      issuer: 'https://saml.boxyhq.com',
      path: '/api/oauth/saml',
      oidcPath: '/api/oauth/oidc',
      idpLoginPath: '/auth/idp-login',
    },
    dsync: {
      webhook_url: `${process.env.APP_URL}/api/webhooks/dsync`,
      webhook_secret: process.env.JACKSON_WEBHOOK_SECRET,
    },
  },

  // Users will need to confirm their email before accessing the app feature
  confirmEmail: process.env.CONFIRM_EMAIL === 'true',

  // Mixpanel configuration
  mixpanel: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },

  disableNonBusinessEmailSignup:
    process.env.DISABLE_NON_BUSINESS_EMAIL_SIGNUP === 'true',

  authProviders: process.env.AUTH_PROVIDERS || 'github,credentials',

  otel: {
    prefix: process.env.OTEL_PREFIX || 'boxyhq.saas',
  },

  hideLandingPage: process.env.HIDE_LANDING_PAGE === 'true',

  darkModeEnabled: process.env.NEXT_PUBLIC_DARK_MODE !== 'false',

  teamFeatures: {
    sso: process.env.FEATURE_TEAM_SSO !== 'false',
    dsync: process.env.FEATURE_TEAM_DSYNC !== 'false',
    webhook: process.env.FEATURE_TEAM_WEBHOOK !== 'false',
    apiKey: process.env.FEATURE_TEAM_API_KEY !== 'false',
    auditLog: process.env.FEATURE_TEAM_AUDIT_LOG !== 'false',
    payments:
      process.env.FEATURE_TEAM_PAYMENTS === 'false'
        ? false
        : Boolean(
            process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
          ),
    deleteTeam: process.env.FEATURE_TEAM_DELETION !== 'false',
    venues: process.env.FEATURE_TEAM_VENUES !== 'false',
  },

  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY || null,
    secretKey: process.env.RECAPTCHA_SECRET_KEY || null,
  },

  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,

  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    defaultClientId: process.env.SPOTIFY_DEFAULT_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID || '',
    defaultClientSecret: process.env.SPOTIFY_DEFAULT_CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET || '',
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    apiKey: process.env.N8N_API_KEY || '',
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
    webhooks: {
      createPlaylist: process.env.N8N_WEBHOOK_CREATE_PLAYLIST_URL || `${process.env.N8N_WEBHOOK_URL || ''}/create-playlist`,
      validateRules: process.env.N8N_WEBHOOK_VALIDATE_RULES_URL || `${process.env.N8N_WEBHOOK_URL || ''}/validate-rules`,
      addSongToPlaylist: process.env.N8N_WEBHOOK_ADD_SONG_TO_PLAYLIST_URL || `${process.env.N8N_WEBHOOK_URL || ''}/add-song-to-playlist`,
      searchTrack: process.env.N8N_WEBHOOK_SEARCH_TRACK_URL || `${process.env.N8N_WEBHOOK_URL || ''}/search-track`,
      addSongToQueue: process.env.N8N_WEBHOOK_ADD_SONG_TO_QUEUE_URL || `${process.env.N8N_WEBHOOK_URL || ''}/add-song-to-queue`,
      skipTrack: process.env.N8N_WEBHOOK_SKIP_TRACK_URL || `${process.env.N8N_WEBHOOK_URL || ''}/skip-track`,
    },
  },
};

export default env;
