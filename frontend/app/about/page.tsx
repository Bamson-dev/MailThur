import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "About MailThur | Cold Email Outreach Platform",
  description:
    "MailThur helps freelancers, agencies, and consultants send professional cold email campaigns from their own inbox.",
};

export default function AboutPage() {
  return (
    <PublicPageShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">About MailThur</h1>
        <p className="mt-6 text-lg leading-relaxed text-body">
          MailThur is a cold email outreach platform built for freelancers,
          agency owners, consultants, and digital marketers who want to send
          professional campaigns from their own Gmail inbox — not a shared
          sending pool.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Who it&apos;s for</h2>
          <p className="mt-4 text-sm leading-relaxed text-body">
            Whether you are a solo freelancer prospecting for clients, an agency
            running outreach for multiple customers, or a consultant building
            pipeline, MailThur gives you the tools to connect your inbox, build
            multi-step sequences, import contacts, and launch campaigns with
            confidence.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">How it works</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-body">
            <li>Connect your Gmail or Google Workspace inbox with one click.</li>
            <li>Build personalized email sequences with automated follow-ups.</li>
            <li>Import contacts from CSV or LeadThur.</li>
            <li>Launch campaigns and track opens, replies, and deliverability.</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Who built it</h2>
          <p className="mt-4 text-sm leading-relaxed text-body">
            MailThur is built and operated by Pdigital Marketstore Ltd, Lagos,
            Nigeria (RC 8015428). We focus on reliable, compliant cold email
            infrastructure for the African market and beyond, with local NGN
            pricing and Gmail-native sending.
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-border-subtle bg-surface p-6">
          <h2 className="text-lg font-semibold text-white">Questions?</h2>
          <p className="mt-2 text-sm text-body">
            Reach us anytime at{" "}
            <a
              href="mailto:support@mailthur.com"
              className="text-accent hover:underline"
            >
              support@mailthur.com
            </a>
            .
          </p>
        </section>

        <p className="mt-12 text-sm text-muted">
          <Link href="/" className="text-accent hover:underline">
            Back to home
          </Link>
          {" · "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
        </p>
      </article>
    </PublicPageShell>
  );
}
