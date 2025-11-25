<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/boxyhq/jackson/assets/66887028/871d9c0f-d351-49bb-9458-2542830d7910">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/boxyhq/jackson/assets/66887028/4073c181-0653-4d5b-b74f-e7e84fe79da8">
  <img alt="BoxyHQ Banner" src="https://github.com/boxyhq/jackson/assets/66887028/b40520b7-dbce-400b-88d3-400d1c215ea1">
</picture>

# ⭐ Enterprise SaaS Starter Kit

<p>
    <a href="https://github.com/boxyhq/saas-starter-kit/stargazers"><img src="https://img.shields.io/github/stars/boxyhq/saas-starter-kit" alt="Github stargazers"></a>
    <a href="https://github.com/boxyhq/saas-starter-kit/issues"><img src="https://img.shields.io/github/issues/boxyhq/saas-starter-kit" alt="Github issues"></a>
    <a href="https://github.com/boxyhq/saas-starter-kit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/boxyhq/saas-starter-kit" alt="license"></a>
    <a href="https://twitter.com/BoxyHQ"><img src="https://img.shields.io/twitter/follow/BoxyHQ?style=social" alt="Twitter"></a>
    <a href="https://www.linkedin.com/company/boxyhq"><img src="https://img.shields.io/badge/LinkedIn-blue" alt="LinkedIn"></a>
    <a href="https://discord.gg/uyb7pYt4Pa"><img src="https://img.shields.io/discord/877585485235630130" alt="Discord"></a>
</p>

The Open Source Next.js SaaS boilerplate for Enterprise SaaS app development.

Please star ⭐ the repo if you want us to continue developing and improving the SaaS Starter Kit! 😀

## 📖 Additional Resources

Video - [BoxyHQ's SaaS Starter Kit: Your Ultimate Enterprise-Compliant Boilerplate](https://www.youtube.com/watch?v=oF8QIwQIhyo) <br>
Blog - [Enterprise-ready Saas Starter Kit](https://boxyhq.com/blog/enterprise-ready-saas-starter-kit)

Next.js-based SaaS starter kit saves you months of development by starting you off with all the features that are the same in every product, so you can focus on what makes your app unique.

## 🛠️ Tech Stack

### Core Framework & Runtime
- **[Next.js 15.3.3](https://nextjs.org)** - React framework with SSR, SSG, and API routes
  - Production-ready, stable release
  - Uses standalone output mode for optimized Docker deployments
  - Configuration: `next.config.js`
- **[Node.js 20.19.5 LTS](https://nodejs.org)** - JavaScript runtime (Alpine Linux base)
  - ⚠️ **Status**: Currently in Maintenance LTS phase (until April 2026)
  - **Recommendation**: Consider upgrading to Node.js 22 LTS for active support
  - Running in Docker container: `node:20-alpine`
- **[React 18.3.1](https://reactjs.org)** - UI library for building interactive components
  - Latest stable version with concurrent features
- **[TypeScript 5.8.3](https://www.typescriptlang.org)** - Typed JavaScript superset
  - Latest stable version with enhanced type safety

### Database & ORM
- **[PostgreSQL 16.4](https://www.postgresql.org)** - Relational database
  - Latest stable release, production-ready
  - Running in Docker: `postgres:16.4`
  - Connection managed via Prisma ORM
- **[Prisma 6.9.0](https://www.prisma.io)** - Next-generation ORM
  - ⚠️ **Status**: Latest is 6.19.0 (released Nov 2025)
  - **Recommendation**: Update to latest for bug fixes and performance improvements
  - Schema: `prisma/schema.prisma`
  - Migrations: `prisma/migrations/`

### Styling & UI
- **[Tailwind CSS 3.4.17](https://tailwindcss.com)** - Utility-first CSS framework
  - Configuration: `tailwind.config.js`
- **[DaisyUI 4.12.24](https://daisyui.com)** - Component library for Tailwind
  - Themes: Corporate, Black (dark mode support)
- **[React DaisyUI 5.0.5](https://react-daisyui.vercel.app)** - React components for DaisyUI
- **[Heroicons 2.2.0](https://heroicons.com)** - Icon library

### Authentication & Security
- **[NextAuth.js 4.24.11](https://next-auth.js.org)** - Authentication framework
  - ⚠️ **Status**: NextAuth v5 (Auth.js) is available but not yet migrated
  - Supports: Email, Magic Link, GitHub, Google, SAML SSO
  - Session strategy: JWT (configurable)
  - Configuration: `lib/nextAuth.ts`
- **[SAML Jackson 1.49.0](https://github.com/boxyhq/jackson)** - SAML SSO & Directory Sync
  - Embedded Jackson for SSO and SCIM directory sync
  - Configuration: `lib/jackson/`
- **[bcryptjs 3.0.2](https://github.com/dcodeIO/bcrypt.js)** - Password hashing
- **Security Headers** - CSP, HSTS, X-Frame-Options configured in `middleware.ts`

### Third-Party Services
- **[Svix](https://www.svix.com/)** - Webhook orchestration service
  - Event emission for user/team CRUD operations
- **[Retraced](https://github.com/retracedhq/retraced)** - Audit logging service
  - Tracks user activities and system events
- **[Stripe 17.7.0](https://stripe.com)** - Payment processing
  - Latest SDK version
- **[Sentry 9.29.0](https://sentry.io)** - Error tracking and monitoring
  - Next.js integration with source maps support
- **[n8n](https://n8n.io)** - Workflow automation (custom integration)
  - Webhook client: `lib/n8n-webhooks.ts`
  - Used for Spotify playlist management and automation

### Form Management & Validation
- **[Formik 2.4.6](https://formik.org)** - Form state management
- **[Yup 1.6.1](https://github.com/jquense/yup)** - Schema validation (used with Formik)
- **[Zod 3.25.64](https://zod.dev)** - TypeScript-first schema validation
  - Primary validation library for API endpoints
  - Configuration: `lib/zod/`

### State Management & Data Fetching
- **[SWR 2.3.3](https://swr.vercel.app)** - Data fetching with React Hooks
  - Client-side data synchronization
- **React Context** - For theme and user state

### Internationalization
- **[next-i18next 15.4.2](https://github.com/i18next/next-i18next)** - i18n for Next.js
- **[i18next 25.2.1](https://www.i18next.com)** - Internationalization framework
- **[react-i18next 15.5.3](https://react.i18next.com)** - React bindings for i18next

### Email
- **[Nodemailer 6.10.1](https://nodemailer.com)** - Email sending
- **[React Email 4.0.16](https://react.email)** - Email template components
- **[@react-email/components 0.0.42](https://react.email/components)** - Email UI components

### Testing
- **[Playwright 1.53.0](https://playwright.dev)** - End-to-end testing
  - Configuration: `playwright.config.ts`
  - Tests: `tests/e2e/`
- **[Jest 30.0.0](https://jestjs.io)** - Unit testing framework
  - Configuration: `jest.config.js`
- **[Testing Library 6.6.3](https://testing-library.com)** - React component testing

### Development Tools
- **[ESLint 9.28.0](https://eslint.org)** - Code linting
  - Configuration: `eslint.config.cjs`
  - Plugins: TypeScript, i18next, Next.js
- **[Prettier 3.5.3](https://prettier.io)** - Code formatting
- **[Docker & Docker Compose](https://www.docker.com)** - Containerization
  - Multi-stage Dockerfile for optimized builds
  - `docker-compose.yml` for local development
  - Services: PostgreSQL, Next.js app

### Monitoring & Analytics
- **[Mixpanel](https://mixpanel.com)** - Product analytics (optional)
- **[OpenTelemetry](https://opentelemetry.io)** - Observability (optional)
  - Metrics export support

### Additional Libraries
- **[Sharp 0.34.2](https://sharp.pixelplumbing.com)** - Image processing
- **[Slack Notify 2.0.7](https://github.com/andrewsuzuki/slack-notify)** - Slack notifications
- **[React Hot Toast 2.5.2](https://react-hot-toast.com)** - Toast notifications
- **[Currency Symbol Map 5.1.0](https://github.com/bengourley/currency-symbol-map)** - Currency utilities

## 📊 Production Readiness Assessment

### ✅ Production-Ready Components
- **Next.js 15.3.3** - Stable, widely used in production
- **PostgreSQL 16.4** - Latest stable, enterprise-grade
- **React 18.3.1** - Mature, production-proven
- **TypeScript 5.8.3** - Latest stable
- **Docker Setup** - Optimized multi-stage builds
- **Security Headers** - Comprehensive CSP and security headers
- **Error Tracking** - Sentry integration for production monitoring
- **Structured Logging** - Custom logger with JSON output for Docker logs

### ⚠️ Recommended Updates
1. **Node.js 20 → 22 LTS**
   - Current: Node.js 20.19.5 (Maintenance LTS until April 2026)
   - Recommended: Upgrade to Node.js 22 LTS for active support
   - Impact: Better performance, security updates, longer support
   - Action: Update `Dockerfile` base image to `node:22-alpine`

2. **Prisma 6.9.0 → 6.19.0**
   - Current: Prisma 6.9.0
   - Latest: Prisma 6.19.0 (released Nov 2025)
   - Impact: Bug fixes, performance improvements, new features
   - Action: Run `npm update @prisma/client prisma`

3. **Next.js 15.3.3 → 16.x (Optional)**
   - Current: Next.js 15.3.3 (LTS until Oct 2026)
   - Latest: Next.js 16.x with stable Turbopack
   - Impact: 3x faster builds, 5x faster dev server
   - Action: Consider upgrading after testing (breaking changes possible)

4. **NextAuth.js 4.24.11 → 5.x (Future)**
   - Current: NextAuth v4 (stable)
   - Latest: NextAuth v5 (Auth.js) - major rewrite
   - Impact: Better TypeScript support, improved API
   - Action: Plan migration for future (breaking changes)

### 🔒 Security Status
- ✅ Security headers configured (CSP, HSTS, X-Frame-Options)
- ✅ Password hashing with bcryptjs
- ✅ JWT session management
- ✅ API key authentication support
- ✅ Rate limiting ready (account lockout implemented)
- ✅ Input validation with Zod schemas
- ✅ SQL injection protection via Prisma
- ✅ XSS protection via React and CSP headers

### 📈 Performance Optimizations
- ✅ Next.js standalone output for smaller Docker images
- ✅ Image optimization with Sharp
- ✅ SWR for efficient data fetching and caching
- ✅ Database indexing via Prisma
- ✅ Multi-stage Docker builds for smaller images

### 🐳 Docker & Deployment
- ✅ Multi-stage Dockerfile for optimized production builds
- ✅ Docker Compose for local development
- ✅ Health checks configured for database
- ✅ Environment variable management
- ✅ Non-root user in production container
- ✅ Standalone Next.js output for minimal dependencies

### 📝 Summary
**Overall Assessment: ✅ Production-Ready with Recommended Updates**

The tech stack is **solid and production-ready** with modern, well-maintained technologies. The application uses:
- Latest stable versions of core frameworks (Next.js, React, TypeScript)
- Enterprise-grade database (PostgreSQL 16.4)
- Comprehensive security measures
- Optimized Docker deployment setup
- Professional monitoring and error tracking

**Urgent Actions (Recommended but not blocking):**
1. ⚠️ **Node.js 20 → 22 LTS**: Upgrade for active LTS support (currently in maintenance phase)
2. ⚠️ **Prisma 6.9.0 → 6.19.0**: Update for latest bug fixes and performance improvements

**Future Considerations:**
- Next.js 16.x migration for Turbopack performance gains (when ready)
- NextAuth v5 migration (plan for future, breaking changes expected)

**No Critical Issues Found** - The stack is ready for production deployment as-is, with the recommended updates being optimizations rather than requirements.

## 🚀 Deployment

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fboxyhq%2Fsaas-starter-kit&env=NEXTAUTH_SECRET,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,SMTP_FROM,DATABASE_URL,APP_URL">
<img width="90" alt="Deploy with Vercel" src="https://vercel.com/button" />
</a>

<a href="https://heroku.com/deploy" alt="Deploy to Heroku">
<img alt="Deploy to Heroku" src="https://www.herokucdn.com/deploy/button.svg" />
</a>

<a href="https://cloud.digitalocean.com/apps/new?repo=https://github.com/boxyhq/saas-starter-kit/tree/main" alt="Deploy to DO">
<img width="200" alt="Deploy to DO" src="https://www.deploytodo.com/do-btn-blue-ghost.svg" />
</a>

## ✨ Getting Started

Please follow these simple steps to get a local copy up and running.

### Prerequisites

- Node.js (Version: >=18.x)
- PostgreSQL
- NPM
- Docker compose

### Development

#### 1. Setup

- [Fork](https://github.com/boxyhq/saas-starter-kit/fork) the repository
- Clone the repository by using this command:

```bash
git clone https://github.com/<your_github_username>/saas-starter-kit.git
```

#### 2. Go to the project folder

```bash
cd saas-starter-kit
```

#### 3. Install dependencies

```bash
npm install
```

#### 4. Set up your .env file

Duplicate `.env.example` to `.env`.

```bash
cp .env.example .env
```

#### 5. Create a database (Optional)

To make the process of installing dependencies easier, we offer a `docker-compose.yml` with a Postgres container.

```bash
docker-compose up -d
```

#### 6. Set up database schema

```bash
npx prisma db push
```

#### 7. Start the server

In a development environment:

```bash
npm run dev
```

#### 8. Start the Prisma Studio

Prisma Studio is a visual editor for the data in your database.

```bash
npx prisma studio
```

#### 9. Testing

We are using [Playwright](https://playwright.dev/) to execute E2E tests. Add all tests inside the `/tests` folder.

Update `playwright.config.ts` to change the playwright configuration.

##### Install Playwright dependencies

```bash
npm run playwright:update
```

##### Run E2E tests

```bash
npm run test:e2e
```

_Note: HTML test report is generated inside the `report` folder. Currently supported browsers for test execution `chromium` and `firefox`_

## ⚙️ Feature configuration

To get started you only need to configure the database by following the steps above. For more advanced features, you can configure the following:

### Authentication with NextAuth.js

The default login options are email and GitHub. Configure below:

1. Generate a secret key for NextAuth.js by running `openssl rand -base64 32` and adding it to the `.env` file as `NEXTAUTH_SECRET`.
2. For email login, configure the `SMTP_*` environment variables in the `.env` file to send magic link login emails. You can use services like [AWS SES](https://aws.amazon.com/ses/), [Sendgrid](https://sendgrid.com/) or [Resend](https://resend.com/).
3. For social login with GitHub and Google, you need to create OAuth apps in the respective developer consoles and add the client ID and secret to the `.env` file. The default is email login and For GitHub, follow the instructions [here](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app). For Google, follow the instructions [here](https://support.google.com/cloud/answer/6158849?hl=en).

### Svix Webhooks

1. Create an account on [Svix](https://www.svix.com/)
2. The authenticaton token and add `SVIX_API_KEY` to the `.env` file.

### Stripe Payments

1. Create an account on [Stripe](https://stripe.com/)
2. Add the [Stripe API secret key](https://dashboard.stripe.com/apikeys) to the `.env` file as `STRIPE_SECRET_KEY`.
3. Create a webhook in the [Stripe dashboard](https://dashboard.stripe.com/webhooks). The URL is your app hostname plus `/api/webhooks/stripe`. If you want to set this up locally you will need to use the [Stripe CLI forwarder](https://docs.stripe.com/webhooks#test-webhook).
4. Once created, add the signing secret to the `.env` file as `STRIPE_WEBHOOK_SECRET`.

### Recaptcha

1. Create an account on [Google reCAPTCHA](https://www.google.com/recaptcha/admin/enterprise). This will create a Google Cloud account if you don't have one.
2. From the Key Details in the [Google Cloud Console](https://console.cloud.google.com/security/recaptcha), add the reCAPTCHA ID to the `.env` file as `RECAPTCHA_SITE_KEY`.
3. Click Key Details > Integration then click Use legacy key to get the secret key and add it to the `.env` file as `RECAPTCHA_SECRET_KEY`.

### Sentry

1. Create an account on [Sentry](https://sentry.io/), skip the onboarding and create a new Next.js project.
2. At the bottom of the page, get the DSN and add it to the `.env` file as `SENTRY_DSN`. The other variables are optional.

#### Fully customizable boilerplate out of the box, see images below 👇👇👇

![saas-starter-kit-poster](/public/saas-starter-kit-poster.png)

## 🥇 Features

- Create account
- Sign in with Email and Password
- Sign in with Magic Link
- Sign in with SAML SSO
- Sign in with Google [[Setting up Google OAuth](https://support.google.com/cloud/answer/6158849?hl=en)]
- Sign in with GitHub [[Creating a Github OAuth App](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)]
- Directory Sync (SCIM)
- Update account
- Create team
- Delete team
- Invite users to the team
- Manage team members
- Update team settings
- Webhooks & Events
- Internationalization
- Audit logs
- Roles and Permissions
- Dark mode
- Email notifications
- E2E tests
- Docker compose
- Prisma Studio
- Update member role
- Directory Sync Events
- Avatar Upload
- SAML SSO
- Audit Log
- Webhook
- Payments
- Security Headers
- **API Keys** - Create and manage API keys for programmatic access
- **RESTful API** - Complete API for user and venue management

## 🔑 API Keys & API Access

The application provides API key authentication for programmatic access to all endpoints. API keys are recommended for automated testing, server-to-server communication, and external integrations.

### Creating API Keys

1. **Login** as a user (Super Admin for admin endpoints)
2. **Navigate to Settings → Security** (`/settings/security`)
3. **Scroll to "API Keys" section**
4. **Click "Create API Key"**
5. **Enter a name** (e.g., "Admin API Key", "Testing Key", "Production Key")
6. **Copy the API key immediately** - you won't be able to see it again once you close the dialog!

### Using API Keys

API keys use Bearer token authentication in the `Authorization` header:

```bash
# Set your API key
export API_KEY="your-api-key-here"

# Use in API requests
curl -X GET http://localhost:4002/api/admin/users \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

### API Key Features

- ✅ **User-specific permissions** - API keys inherit permissions from the user who created them
- ✅ **Super Admin API keys** - Can access all admin endpoints
- ✅ **Usage tracking** - `lastUsedAt` timestamp is automatically updated
- ✅ **Multiple keys** - Create unlimited API keys for different purposes
- ✅ **Revocable** - Delete API keys anytime from the Settings page
- ✅ **No expiration** - API keys don't expire by default (optional expiration available)

### Why Use API Keys?

**API Keys are better for:**
- Automated testing and scripts
- Server-to-server communication
- CI/CD pipelines
- Long-running processes
- External integrations
- API clients (Postman, Insomnia, etc.)
- Production environments

**Session Tokens are better for:**
- Browser-based interactions
- Short-term testing
- Development/debugging
- Interactive use

## 📡 API Endpoints

### Base URL
```
http://localhost:4002
```

### Authentication

All API endpoints support two authentication methods:

1. **API Key (Recommended)** - Bearer token in `Authorization` header
   ```bash
   -H "Authorization: Bearer $API_KEY"
   ```

2. **Session Token** - Cookie-based authentication
   ```bash
   -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
   ```

### Super Admin Endpoints

Super Admin endpoints require a user with `SUPERADMIN` role. All endpoints support both API key and session token authentication.

#### User Management

**Get All Users**
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Create User**
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "USER"
  }' \
  | jq .
```

**Update User**
```bash
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "SUPERADMIN"
  }' \
  | jq .
```

**Block User**
```bash
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"blocked": true}' \
  | jq .
```

**Unblock User**
```bash
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"blocked": false}' \
  | jq .
```

**Change User Password**
```bash
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"newPassword": "NewSecurePass123!"}' \
  | jq .
```

**Delete User**
```bash
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID \
  -H "Authorization: Bearer $API_KEY"
```

#### Venue Management (Admin Access)

**Get All Venues for a User**
```bash
curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Create Venue for User**
```bash
curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Admin Created Venue",
    "slug": "admin-venue",
    "address": "123 Admin Street",
    "mode": "QUEUE",
    "isActive": true
  }' \
  | jq .
```

**Get Venue by ID**
```bash
curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Update Venue**
```bash
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Updated Venue Name",
    "isActive": false
  }' \
  | jq .
```

**Delete Venue**
```bash
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Authorization: Bearer $API_KEY"
```

### API Key Management Endpoints

**Get All Your API Keys**
```bash
curl -X GET http://localhost:4002/api/api-keys \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Create New API Key**
```bash
curl -X POST http://localhost:4002/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"name": "New API Key"}' \
  | jq .
```
**Note:** The response includes the `apiKey` field - save it immediately!

**Delete API Key**
```bash
curl -X DELETE http://localhost:4002/api/api-keys/$API_KEY_ID \
  -H "Authorization: Bearer $API_KEY"
```

### User Endpoints

**Get All Venues (Current User)**
```bash
curl -X GET http://localhost:4002/api/venues \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Create Venue (Current User)**
```bash
curl -X POST http://localhost:4002/api/venues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "My Venue",
    "slug": "my-venue",
    "mode": "QUEUE",
    "isActive": true
  }' \
  | jq .
```

**Get Venue by ID**
```bash
curl -X GET http://localhost:4002/api/venues/$VENUE_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Update Venue**
```bash
curl -X PUT http://localhost:4002/api/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Updated Venue",
    "isActive": false
  }' \
  | jq .
```

**Delete Venue**
```bash
curl -X DELETE http://localhost:4002/api/venues/$VENUE_ID \
  -H "Authorization: Bearer $API_KEY"
```

### Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Resource deleted successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `500 Internal Server Error` - Server error

### Complete API Documentation

For detailed API documentation with all endpoints and examples, see:
- [`ADMIN-API-TESTS.md`](./ADMIN-API-TESTS.md) - Complete Super Admin API reference
- [`ADMIN-API-TESTS-WITH-API-KEYS.md`](./ADMIN-API-TESTS-WITH-API-KEYS.md) - API key focused guide
- [`API-KEYS-GUIDE.md`](./API-KEYS-GUIDE.md) - Comprehensive API keys guide

## ➡️ Coming Soon

- Billing & subscriptions
- Unit and integration tests

## ✨ Contributing

Thanks for taking the time to contribute! Contributions make the open-source community a fantastic place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please try to create bug reports that are:

- _Reproducible._ Include steps to reproduce the problem.
- _Specific._ Include as much detail as possible: which version, what environment, etc.
- _Unique._ Do not duplicate existing opened issues.
- _Scoped to a Single Bug._ One bug per report.

[Contributing Guide](https://github.com/boxyhq/saas-starter-kit/blob/main/CONTRIBUTING.md)

## 🤩 Community

- [Discord](https://discord.gg/uyb7pYt4Pa) (For live discussion with the Open-Source Community and BoxyHQ team)
- [Twitter](https://twitter.com/BoxyHQ) / [LinkedIn](https://www.linkedin.com/company/boxyhq) (Follow us)
- [Youtube](https://www.youtube.com/@boxyhq) (Watch community events and tutorials)
- [GitHub Issues](https://github.com/boxyhq/saas-starter-kit/issues) (Contributions, report issues, and product ideas)

## 🌍 Contributors

<a href="https://github.com/boxyhq/saas-starter-kit/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=boxyhq/saas-starter-kit" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## 🛡️ License

[Apache 2.0 License](https://github.com/boxyhq/saas-starter-kit/blob/main/LICENSE)
