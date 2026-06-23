import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Terms of Service | MailThur",
  description:
    "Read the terms and conditions governing your use of MailThur's cold email outreach platform.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-body">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <PublicPageShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">MailThur Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 24, 2026</p>

        <Section title="1. Acceptance">
          <p>
            By using MailThur (mailthur.com), operated by Pdigital Marketstore
            Ltd (RC 8015428), Lagos, Nigeria, you agree to these Terms of
            Service. If you do not agree, do not use the platform.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            MailThur is a cold email sequencing and outreach automation
            platform. It allows users to connect their own Gmail or Google
            Workspace accounts and send automated outreach email sequences to
            contacts they provide.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>
            You agree to use MailThur only for lawful cold email outreach. You
            must comply with all applicable anti-spam laws including CAN-SPAM,
            GDPR where applicable, and Nigerian data protection regulations.
            You must only send emails to contacts who have a legitimate basis
            for being contacted. You must honor all unsubscribe requests
            immediately. You must not use MailThur to send spam, phishing
            emails, malware, illegal content, or any content that violates the
            terms of service of Google or any other provider. You are solely
            responsible for the content of emails you send through MailThur and
            for compliance with applicable laws in your jurisdiction.
          </p>
        </Section>

        <Section title="4. Gmail Integration">
          <p>
            By connecting your Gmail account, you authorize MailThur to send
            emails and read email threads on your behalf using Google&apos;s
            OAuth 2.0 protocol. You may revoke this access at any time. You
            remain solely responsible for all emails sent from your connected
            Gmail account through MailThur.
          </p>
        </Section>

        <Section title="5. Prohibited Activities">
          <p>
            You must not use MailThur to send unsolicited bulk email to people
            who have not consented to receive communications from you. You must
            not impersonate another person or organization. You must not use
            purchased or scraped email lists that violate applicable law.
            Violation of these terms may result in immediate account
            termination.
          </p>
        </Section>

        <Section title="6. Subscriptions and Payments">
          <p>
            MailThur offers a 3-day free trial with a 500 email cap. After the
            trial, a paid subscription is required to continue sending.
            Subscriptions are billed monthly. We offer a 30-day money back
            guarantee on your first payment. Refunds after 30 days are at our
            discretion. You may cancel your subscription at any time from your
            dashboard. Cancellation takes effect at the end of your current
            billing period.
          </p>
        </Section>

        <Section title="7. Account Termination">
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms, abuse the platform, or engage in sending activity that
            damages our infrastructure or reputation. We will provide notice
            where reasonably possible.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            MailThur is provided as is. Pdigital Marketstore Ltd is not liable
            for any indirect, incidental, or consequential damages arising from
            your use of the platform. Our total liability is limited to the
            amount you paid us in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="9. Changes">
          <p>
            We may update these terms at any time. Continued use of MailThur
            after changes constitutes acceptance of the new terms.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These terms are governed by the laws of the Federal Republic of
            Nigeria.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            <a
              href="mailto:support@mailthur.com"
              className="text-accent hover:underline"
            >
              support@mailthur.com
            </a>
            <br />
            Pdigital Marketstore Ltd, Lagos, Nigeria
          </p>
        </Section>

        <p className="mt-12 text-sm text-muted">
          See also our{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </article>
    </PublicPageShell>
  );
}
