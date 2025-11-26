/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable i18next/no-literal-string */
/* eslint-disable react/no-unescaped-entities */
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSidePropsContext } from 'next';
import Link from 'next/link';

// Use APP_URL from environment for examples, with localhost fallback for dev
const appUrl = process.env.APP_URL || 'http://localhost:4002';
const spotifyCallbackUrl = `${appUrl}/api/spotify/callback`;

export default function SpotifyAppSetupHelp() {

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/venues/create" className="link link-primary">
          ← Back to Create Venue
        </Link>
      </div>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-3xl font-bold mb-4">How to Create a Spotify App for Automation Mode</h1>
        
        <div className="alert alert-info mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>
            Automation Mode requires your own Spotify app credentials to enable full playback control. 
            This guide will walk you through creating a Spotify app and obtaining your Client ID and Secret.
          </span>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Step 1: Access Spotify Developer Dashboard</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="link link-primary">Spotify Developer Dashboard</a></li>
          <li>Log in with your Spotify account (or create one if you don't have one)</li>
          <li>Accept the Spotify Developer Terms of Service if prompted</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Step 2: Create a New App</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click the <strong>"Create app"</strong> button (or "Create an app" if this is your first app)</li>
          <li>Fill in the app details:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li><strong>App name:</strong> Choose a name for your app (e.g., "Rockola Venue Control")</li>
              <li><strong>App description:</strong> Describe what your app does (e.g., "Music playback control for venue management")</li>
              <li><strong>Redirect URI:</strong> Add your app's callback URL. For Rockola, use: <code className="bg-base-200 px-2 py-1 rounded">{spotifyCallbackUrl}</code> (or your production URL)</li>
              <li><strong>Website:</strong> Your website URL (optional)</li>
            </ul>
          </li>
          <li>Check the box to confirm you agree to Spotify's Developer Terms</li>
          <li>Click <strong>"Save"</strong></li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Step 3: Get Your Client ID and Secret</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>After creating the app, you'll be taken to your app's dashboard</li>
          <li>You'll see your <strong>Client ID</strong> displayed on the page (it's a long string of characters)</li>
          <li>To view your <strong>Client Secret</strong>:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Click the <strong>"Show client secret"</strong> button</li>
              <li>Copy the secret immediately (you may need to verify your identity)</li>
              <li><strong>Important:</strong> Store this secret securely - you won't be able to see it again after closing the page</li>
            </ul>
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Step 4: Configure Redirect URI</h2>
        <div className="bg-base-200 p-4 rounded-lg mb-4">
          <p className="mb-2">
            In your Spotify app settings, add the following redirect URI (exactly as shown):
          </p>
          <code className="bg-base-300 px-2 py-1 rounded block">{spotifyCallbackUrl}</code>
          <p className="mt-2 text-sm">
            This must match the value configured in Rockola under the Spotify callback URL.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Step 5: Enter Credentials in Rockola</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Return to the Rockola venue creation/editing page</li>
          <li>Select <strong>"Automation Mode"</strong> as your operating mode</li>
          <li>Paste your <strong>Client ID</strong> into the "Spotify Client ID" field</li>
          <li>Paste your <strong>Client Secret</strong> into the "Spotify Client Secret" field</li>
          <li>Save your venue settings</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Important Notes</h2>
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg space-y-2">
          <p><strong>Security:</strong> Never share your Client Secret publicly. Keep it secure and only enter it in the Rockola interface.</p>
          <p><strong>Rate Limits:</strong> Each Spotify app has rate limits. If you expect high traffic, consider creating multiple apps for different venues.</p>
          <p><strong>Permissions:</strong> Your app will need the following Spotify permissions:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>user-read-playback-state</li>
              <li>user-modify-playback-state</li>
              <li>playlist-read-private</li>
              <li>playlist-modify-public</li>
              <li>playlist-modify-private</li>
            </ul>
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Troubleshooting</h2>
        <div className="space-y-3">
          <div>
            <strong>Problem:</strong> "Invalid redirect URI" error
            <br />
            <strong>Solution:</strong> Make sure the redirect URI in your Spotify app settings exactly matches the one used by Rockola (including http vs https and port numbers).
          </div>
          <div>
            <strong>Problem:</strong> Can't see Client Secret
            <br />
            <strong>Solution:</strong> Click "Show client secret" and verify your identity if prompted. The secret is only shown once for security.
          </div>
          <div>
            <strong>Problem:</strong> App not appearing in dashboard
            <br />
            <strong>Solution:</strong> Refresh the page or check if you're logged into the correct Spotify account.
          </div>
        </div>

        <div className="mt-8 p-4 bg-base-200 rounded-lg">
          <p className="mb-2"><strong>Need more help?</strong></p>
          <p>For additional information, visit the <a href="https://developer.spotify.com/documentation/web-api" target="_blank" rel="noopener noreferrer" className="link link-primary">Spotify Web API Documentation</a>.</p>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(context.locale || 'en', ['common'])),
    },
  };
}
