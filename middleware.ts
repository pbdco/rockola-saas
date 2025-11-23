import micromatch from 'micromatch';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import env from './lib/env';

// Constants for security headers
const SECURITY_HEADERS = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
} as const;

// Generate CSP
const generateCSP = (): string => {
  const policies = {
    'default-src': ["'self'"],
    'img-src': [
      "'self'",
      'boxyhq.com',
      '*.boxyhq.com',
      '*.dicebear.com',
      'data:',
    ],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      '*.gstatic.com',
      '*.google.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'connect-src': [
      "'self'",
      '*.google.com',
      '*.gstatic.com',
      'boxyhq.com',
      '*.ingest.sentry.io',
      '*.mixpanel.com',
    ],
    'frame-src': ["'self'", '*.google.com', '*.gstatic.com'],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  return Object.entries(policies)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .concat(['upgrade-insecure-requests'])
    .join('; ');
};

// Add routes that don't require authentication
const unAuthenticatedRoutes = [
  '/api/hello',
  '/api/health',
  '/api/auth/**',
  '/api/oauth/**',
  '/api/scim/v2.0/**',
  '/api/invitations/*',
  '/api/webhooks/stripe',
  '/api/webhooks/dsync',
  '/auth/**',
  '/invitations/*',
  '/terms',
  '/terms-condition',
  '/privacy',
  '/unlock-account',
  '/login/saml',
  '/.well-known/*',
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files (images, fonts, etc.)
  const staticFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot'];
  if (staticFileExtensions.some(ext => pathname.toLowerCase().endsWith(ext))) {
    return NextResponse.next();
  }

  // Explicitly check for public pages first
  if (pathname === '/terms' || pathname === '/privacy') {
    const requestHeaders = new Headers(req.headers);
    const csp = generateCSP();
    requestHeaders.set('Content-Security-Policy', csp);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    if (env.securityHeadersEnabled) {
      response.headers.set('Content-Security-Policy', csp);
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  // Bypass routes that don't require authentication
  if (micromatch.isMatch(pathname, unAuthenticatedRoutes)) {
    return NextResponse.next();
  }

  // Check for API key authentication (Bearer token)
  // If API key is present, allow request through (API endpoints will validate it)
  const authHeader = req.headers.get('authorization');
  const hasApiKey = authHeader && authHeader.startsWith('Bearer ');

  // If API key is provided, skip session check and let API endpoint handle validation
  if (hasApiKey) {
    const requestHeaders = new Headers(req.headers);
    const csp = generateCSP();
    requestHeaders.set('Content-Security-Policy', csp);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    if (env.securityHeadersEnabled) {
      response.headers.set('Content-Security-Policy', csp);
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  const redirectUrl = new URL('/auth/login', req.url);
  
  // Only set callbackUrl if we're not already going to login/auth pages
  // and use only the pathname to avoid host issues (0.0.0.0 vs localhost)
  if (!pathname.startsWith('/auth/') && !pathname.startsWith('/login/')) {
    // Use only the pathname to avoid issues with different hosts (0.0.0.0 vs localhost)
    const callbackPath = pathname + (req.nextUrl.search || '');
    redirectUrl.searchParams.set('callbackUrl', callbackPath);
  }

  // JWT strategy
  if (env.nextAuth.sessionStrategy === 'jwt') {
    const token = await getToken({
      req,
    });

    if (!token || !token.sub) {
      return NextResponse.redirect(redirectUrl);
    }

    // Note: User existence and blocked status checks are handled in the session callback
    // which runs in Node.js runtime, not Edge Runtime
  }

  // Database strategy
  else if (env.nextAuth.sessionStrategy === 'database') {
    const url = new URL('/api/auth/session', req.url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
    });

    const session = await response.json();

    if (!session.user || !session.user.id) {
      return NextResponse.redirect(redirectUrl);
    }

    // Note: User existence and blocked status checks are handled in the session callback
    // which runs in Node.js runtime, not Edge Runtime. The session callback will
    // clear session.user.id if the user is deleted or blocked, which will be caught here.
  }

  const requestHeaders = new Headers(req.headers);
  const csp = generateCSP();

  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (env.securityHeadersEnabled) {
    // Set security headers
    response.headers.set('Content-Security-Policy', csp);
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // All good, let the request through
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/session (session endpoint)
     * - Static file extensions (png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/session|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.eot).*)',
  ],
};
