import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | MailThur",
  description:
    "Learn how MailThur collects, uses, and protects your personal data and Gmail access.",
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

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">MailThur Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 24, 2026</p>

        <Section title="1. Introduction">
          <p>
            MailThur (mailthur.com) is operated by Pdigital Marketstore Ltd (RC
            8015428), Lagos, Nigeria. This Privacy Policy explains how we
            collect, use, and protect your information when you use our cold
            email outreach platform.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>
            <strong className="text-white">Account information:</strong> your
            email address when you create an account or sign in.
          </p>
          <p>
            <strong className="text-white">Connected inbox information:</strong>{" "}
            when you connect a Gmail or Google Workspace account, we store an
            OAuth access token and refresh token that allow us to send emails
            and read email threads on your behalf. We do not store the content
            of your emails.
          </p>
          <p>
            <strong className="text-white">Campaign data:</strong> campaign
            names, email sequence content you write, contact lists you import,
            and sending activity logs.
          </p>
          <p>
            <strong className="text-white">Usage data:</strong> IP addresses,
            browser type, pages visited, and timestamps for security and
            analytics purposes.
          </p>
        </Section>

        <Section title="3. How We Use Gmail Access">
          <p>
            MailThur requests the following Google OAuth scopes:{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-accent">
              gmail.send
            </code>{" "}
            (to send outreach emails from your connected inbox on your behalf)
            and{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-accent">
              gmail.readonly
            </code>{" "}
            (to detect replies to emails we sent by checking Gmail thread
            activity).
          </p>
          <p>
            We use these permissions exclusively to operate the cold email
            sequencing features you explicitly configure. We do not read, scan,
            analyze, store, or share the content of your emails or your
            contacts&apos; emails beyond what is strictly necessary to send
            messages you have written and detect replies in threads we
            initiated. We do not use Gmail data for advertising, profiling, or
            any purpose beyond the core sending and reply detection features.
          </p>
          <p>
            Your Gmail access tokens are encrypted at rest and never shared with
            third parties except Google&apos;s own API infrastructure.
          </p>
        </Section>

        <Section title="4. Contact List Data">
          <p>
            Contacts you import via CSV or from LeadThur are stored in our
            database solely to enable campaign sending. We do not sell, share,
            or use this data for any purpose other than executing the campaigns
            you configure.
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p>
            We do not sell your personal data. We share data only with:
            Supabase (database infrastructure), Google (OAuth authentication and
            Gmail API), Paystack (payment processing for Nigerian users), and
            Cloudflare (CDN and security). Each of these providers has their own
            privacy policy governing their data handling.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your account data for as long as your account is active.
            You may request deletion of your account and all associated data by
            contacting{" "}
            <a
              href="mailto:support@mailthur.com"
              className="text-accent hover:underline"
            >
              support@mailthur.com
            </a>
            . Upon deletion, we revoke your Gmail OAuth tokens, delete your
            campaign data, contact lists, and sending history within 30 days.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We use industry-standard encryption for data in transit (TLS) and
            at rest. OAuth tokens are stored encrypted. We do not store Gmail
            passwords. Access to your Gmail account is governed entirely by
            Google&apos;s OAuth 2.0 protocol which you can revoke at any time
            from your Google Account security settings at{" "}
            <a
              href="https://myaccount.google.com/permissions"
              className="text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>
            You may access, correct, or delete your personal data at any time
            by contacting us at{" "}
            <a
              href="mailto:support@mailthur.com"
              className="text-accent hover:underline"
            >
              support@mailthur.com
            </a>
            . You may disconnect your Gmail inbox at any time from your
            MailThur dashboard, which immediately revokes our access. You may
            cancel your subscription at any time.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            MailThur is not intended for users under 18 years of age. We do not
            knowingly collect data from minors.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We will notify users of material changes to this policy via email
            and by updating the Last Updated date above.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Pdigital Marketstore Ltd
            <br />
            RC 8015428
            <br />
            Lagos, Nigeria
            <br />
            <a
              href="mailto:support@mailthur.com"
              className="text-accent hover:underline"
            >
              support@mailthur.com
            </a>
          </p>
        </Section>

        <p className="mt-12 text-sm text-muted">
          See also our{" "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </article>
    </PublicPageShell>
  );
}
