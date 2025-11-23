import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { type ReactElement } from 'react';
import app from '@/lib/app';
import { PublicLayout } from '@/components/layouts';
import type { NextPageWithLayout } from 'types';

const TermsPage: NextPageWithLayout = () => {

  return (
    <>
      <Head>
        <title>Terms and Conditions | {app.name}</title>
      </Head>
      <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Terms and Conditions
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing or using {app.name} (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions. 
                If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {app.name} is a platform that enables venue owners to manage music playback through Spotify integration. 
                The Service allows users to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Create and manage venues</li>
                <li>Connect Spotify accounts for music playback control</li>
                <li>Manage song requests and playlists</li>
                <li>Configure pricing for song requests (if enabled)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Spotify Integration and Third-Party Services</h2>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-gray-800 dark:text-gray-200 font-semibold mb-2">
                  IMPORTANT: {app.name} is a Control Service Only
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {app.name} is a technology platform that provides tools to control music streaming services (such as Spotify). 
                  We do NOT use, stream, host, or distribute any copyrighted music or audio content. We do NOT make money from 
                  copyrighted music. We simply provide a service that allows you to control your own music streaming service 
                  playlists and playback. All music content is provided directly by the streaming service (e.g., Spotify), 
                  not by {app.name}.
                </p>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {app.name} integrates with music streaming services (including but not limited to Spotify) to provide music 
                playback control functionality. By using this Service, you acknowledge and agree to the following:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.1 Spotify Terms and Conditions</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>You are required to comply with Spotify&apos;s Terms of Service, Developer Policy, and all applicable Spotify guidelines.</strong> 
                We strongly encourage you to review and understand Spotify&apos;s terms at{' '}
                <a href="https://www.spotify.com/legal/terms-of-use/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://www.spotify.com/legal/terms-of-use/
                </a>
                {' '}and{' '}
                <a href="https://developer.spotify.com/policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://developer.spotify.com/policy
                </a>
                .
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.2 No Responsibility for Music Streaming Service Usage</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>{app.name} is NOT responsible for any violations of any music streaming service&apos;s Terms of Service, Developer Policy, 
                or any copyright, licensing, or intellectual property infringement that may occur through your use of any music streaming 
                service (including but not limited to Spotify, Apple Music, YouTube Music, or any other provider).</strong>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>{app.name} does NOT use, stream, host, distribute, or make money from any copyrighted music or audio content.</strong> 
                We provide only a control interface that allows you to manage playlists and playback on your own music streaming service account. 
                All music content is provided directly by the streaming service, not by {app.name}.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You, as the user and venue owner, are solely responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Ensuring your use of any music streaming service (Spotify, Apple Music, YouTube Music, etc.) complies with all applicable terms, policies, and guidelines</li>
                <li>Obtaining all necessary licenses, permissions, and authorizations for public performance of music</li>
                <li>Complying with all copyright laws and music licensing requirements in your jurisdiction</li>
                <li>Any copyright infringement, licensing violations, or intellectual property disputes arising from your use of any music streaming service</li>
                <li>Any actions taken by any music streaming service provider, including but not limited to account suspension, termination, or legal action</li>
                <li>All legal and financial consequences of playing copyrighted music at your venues</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.3 {app.name} Acts as Control Interface Only</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {app.name} acts solely as a control interface platform that allows you to manage playlists and playback on your own music 
                streaming service accounts. We do NOT:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Use, stream, host, or distribute any copyrighted music or audio content</li>
                <li>Make money from copyrighted music or audio content</li>
                <li>Provide or deliver any music content to your venues</li>
                <li>Control the music streaming service&apos;s content library or availability</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not control, operate, or have any responsibility for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Any music streaming service&apos;s (Spotify, Apple Music, YouTube Music, etc.) service availability, functionality, or content</li>
                <li>Any music streaming service&apos;s terms, policies, or enforcement actions</li>
                <li>The legality of music playback at your venues</li>
                <li>Copyright compliance or licensing for music played through any music streaming service</li>
                <li>Any disputes between you and any music streaming service provider</li>
                <li>Any legal actions, claims, or liabilities arising from your use of any music streaming service</li>
                <li>The content, quality, or availability of music provided by any streaming service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.4 Your Responsibilities</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By using the Service with any music streaming service integration, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>You must have a valid account with the music streaming service (e.g., Spotify, Apple Music) and appropriate developer credentials</li>
                <li>You are responsible for maintaining the security of your music streaming service credentials</li>
                <li>You will comply with all terms of service, developer policies, and guidelines of the music streaming service you use</li>
                <li>You will obtain all necessary public performance licenses (e.g., ASCAP, BMI, SESAC) for music played at your venues</li>
                <li>You understand that {app.name} does NOT use, stream, or distribute copyrighted music and is NOT responsible for any copyright or licensing issues</li>
                <li>You will indemnify and hold harmless {app.name} from any claims, damages, or liabilities arising from your use of any music streaming service</li>
                <li>You grant {app.name} permission to access your music streaming service account solely for the purpose of controlling playlists and playback at your venues</li>
                <li>You understand that all music content is provided by the streaming service, not by {app.name}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. User Accounts</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To use the Service, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Provide accurate and complete information when creating an account</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be at least 18 years old or have parental consent</li>
                <li>Use only work or business email addresses for account creation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Venue Management</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                As a venue owner, you are solely and exclusively responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>All content and music played at your venues, including compliance with all applicable laws and regulations</li>
                <li>Compliance with copyright laws and music licensing requirements in your jurisdiction</li>
                <li>Obtaining and maintaining all necessary licenses for public performance of music (e.g., ASCAP, BMI, SESAC, or equivalent licensing organizations)</li>
                <li>Ensuring that your use of Spotify complies with Spotify&apos;s Terms of Service and all applicable laws</li>
                <li>Managing song requests and ensuring appropriate and legally compliant content is played</li>
                <li>Setting and managing pricing for song requests (if enabled)</li>
                <li>Any copyright infringement, licensing violations, or legal issues arising from music played at your venues</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>{app.name} is not responsible for your compliance with music licensing requirements or copyright laws.</strong> 
                You acknowledge that playing music in public venues typically requires appropriate licensing, and you are solely 
                responsible for obtaining such licenses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Payment and Pricing</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you enable paid song requests:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>You are responsible for setting and managing prices</li>
                <li>All payment processing is handled by third-party payment providers</li>
                <li>You are responsible for any applicable taxes and fees</li>
                <li>Refund policies are at your discretion as the venue owner</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Prohibited Uses</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Violate any intellectual property rights</li>
                <li>Transmit any harmful code, viruses, or malicious software</li>
                <li>Attempt to gain unauthorized access to the Service or other users&apos; accounts</li>
                <li>Use the Service to play copyrighted content without proper licensing</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service and its original content, features, and functionality are owned by {app.name} and are protected 
                by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. 
                We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {app.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including loss of profits, data, or use, incurred by you or any third party, whether in an action in contract 
                or tort, arising from your access to or use of the Service.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>SPECIFICALLY, {app.name} SHALL NOT BE LIABLE FOR ANY CLAIMS, DAMAGES, OR LIABILITIES ARISING FROM:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Your use of any music streaming service (Spotify, Apple Music, YouTube Music, or any other provider), including but not limited to copyright infringement, licensing violations, or intellectual property disputes</li>
                <li>Any violations of any music streaming service&apos;s Terms of Service, Developer Policy, or guidelines</li>
                <li>Any music streaming service&apos;s enforcement actions, including account suspension or termination</li>
                <li>Any disputes between you and any music streaming service provider or any third-party rights holders</li>
                <li>Any legal actions, claims, or proceedings related to music playback or music streaming service usage</li>
                <li>Failure to obtain necessary public performance licenses or comply with copyright laws</li>
                <li>Any claims that {app.name} uses, streams, hosts, or distributes copyrighted music (we do not - we only provide control functionality)</li>
                <li>Any claims that {app.name} makes money from copyrighted music (we do not - we only provide a control service)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree to indemnify, defend, and hold harmless {app.name}, its officers, directors, employees, and agents from and against 
                any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorney&apos;s fees) 
                arising from your use of Spotify, violation of Spotify&apos;s terms, or any copyright or licensing issues.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                for any reason, including breach of these Terms. Upon termination, your right to use the Service will 
                cease immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes. 
                Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Email:</strong>{' '}
                <a 
                  href="mailto:support@rockola.net" 
                  className="text-primary hover:underline"
                >
                  support@rockola.net
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Legal Inquiries:</strong>{' '}
                <a 
                  href="mailto:legal@rockola.net" 
                  className="text-primary hover:underline"
                >
                  legal@rockola.net
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

TermsPage.getLayout = function getLayout(page: ReactElement) {
  return <PublicLayout>{page}</PublicLayout>;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale as string, ['common'])),
    },
  };
};

export default TermsPage;

