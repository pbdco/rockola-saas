import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { type ReactElement } from 'react';
import app from '@/lib/app';
import { PublicLayout } from '@/components/layouts';
import type { NextPageWithLayout } from 'types';

const PrivacyPage: NextPageWithLayout = () => {

  return (
    <>
      <Head>
        <title>Privacy Statement | {app.name}</title>
      </Head>
      <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Statement
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {app.name} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Statement explains 
                how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">2.1 Account Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Name</li>
                <li>Email address</li>
                <li>Password (encrypted and hashed)</li>
                <li>Profile image (if provided)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">2.2 Venue Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you create venues, we collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Venue name and address</li>
                <li>Operating mode and settings</li>
                <li>Pricing configuration (if enabled)</li>
                <li>Spotify app credentials (Client ID and Secret)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">2.3 Spotify Integration Data</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you connect your Spotify account, we collect and store:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Spotify user ID and display name</li>
                <li>OAuth access tokens and refresh tokens (encrypted)</li>
                <li>Token expiration information</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This data is used solely to enable music playback control at your venues. We do not access your personal 
                Spotify playlists, listening history, or other Spotify data beyond what is necessary for the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">2.4 Usage Data</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We automatically collect information about how you use the Service, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>IP address and browser type</li>
                <li>Pages visited and features used</li>
                <li>Date and time of access</li>
                <li>Device information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the collected information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process your account registration and manage your account</li>
                <li>Enable Spotify integration and music playback control</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">4.1 Service Providers</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may share information with third-party service providers who perform services on our behalf, such as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Cloud hosting providers</li>
                <li>Email service providers</li>
                <li>Analytics services</li>
                <li>Payment processors (if applicable)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">4.2 Spotify</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you connect your Spotify account, we interact with Spotify&apos;s API on your behalf. This is governed by 
                Spotify&apos;s Privacy Policy. We only share the minimum information necessary to enable music playback functionality.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">4.3 Legal Requirements</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">4.4 Business Transfers</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of 
                that transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure API key management</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive 
                to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Access and update your account information</li>
                <li>Delete your account and associated data</li>
                <li>Disconnect your Spotify account at any time</li>
                <li>Request a copy of your personal data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To exercise these rights, please contact us at{' '}
                <a 
                  href="mailto:privacy@rockola.net" 
                  className="text-primary hover:underline"
                >
                  privacy@rockola.net
                </a>
                {' '}or update your account settings directly in the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Maintain your session and authentication state</li>
                <li>Remember your preferences</li>
                <li>Analyze Service usage</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can control cookies through your browser settings, but this may affect Service functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your information for as long as your account is active or as needed to provide the Service. 
                When you delete your account, we will delete or anonymize your personal information, except where we 
                are required to retain it for legal purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service is not intended for users under the age of 18. We do not knowingly collect personal information 
                from children. If you believe we have collected information from a child, please contact us immediately at{' '}
                <a 
                  href="mailto:privacy@rockola.net" 
                  className="text-primary hover:underline"
                >
                  privacy@rockola.net
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. 
                These countries may have data protection laws that differ from those in your country. By using the Service, 
                you consent to such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Statement</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Statement from time to time. We will notify you of any material changes by 
                posting the new Privacy Statement on this page and updating the &quot;Last updated&quot; date. Your continued use 
                of the Service after such changes constitutes acceptance of the updated Privacy Statement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Statement or our data practices, please contact us:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>General Inquiries:</strong>{' '}
                <a 
                  href="mailto:support@rockola.net" 
                  className="text-primary hover:underline"
                >
                  support@rockola.net
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Privacy Inquiries:</strong>{' '}
                <a 
                  href="mailto:privacy@rockola.net" 
                  className="text-primary hover:underline"
                >
                  privacy@rockola.net
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Data Protection Officer:</strong>{' '}
                <a 
                  href="mailto:dpo@rockola.net" 
                  className="text-primary hover:underline"
                >
                  dpo@rockola.net
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

PrivacyPage.getLayout = function getLayout(page: ReactElement) {
  return <PublicLayout>{page}</PublicLayout>;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale as string, ['common'])),
    },
  };
};

export default PrivacyPage;

