import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Mail,
  RefreshCw,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import PlanCards, {
  ComparisonTable,
  TrustBadges,
} from "@/components/dashboard/PlanCards";
import PublicPageShell from "./PublicPageShell";
import WaitlistForm from "./WaitlistForm";

const FEATURES = [
  {
    icon: RefreshCw,
    title: "Inbox rotation",
    description:
      "Spread sends across multiple connected accounts to protect deliverability.",
  },
  {
    icon: Zap,
    title: "Automatic sending ramp",
    description:
      "Gradually increase daily volume so new inboxes warm up safely.",
  },
  {
    icon: Mail,
    title: "Reply detection",
    description:
      "Sequences stop automatically when a prospect responds to your outreach.",
  },
  {
    icon: BarChart3,
    title: "Open tracking",
    description:
      "See who opened your emails with built-in pixel tracking.",
  },
  {
    icon: Shield,
    title: "Unsubscribe handling",
    description:
      "One-click unsubscribe links are included on every message.",
  },
  {
    icon: Users,
    title: "LeadThur integration",
    description:
      "Import contacts instantly from LeadThur into your campaigns.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Connect your Gmail inbox with one click",
    description:
      "Authorize MailThur via Google OAuth. We never see your password.",
  },
  {
    step: "2",
    title: "Build your sequence with personalized follow-ups",
    description:
      "Write multi-step campaigns with delays, personalization, and smart timing.",
  },
  {
    step: "3",
    title: "Launch your campaign and track every open and reply",
    description:
      "Send from your own inbox, monitor performance, and close more deals.",
  },
];

const TESTIMONIALS = [
  { name: "Your name here", role: "Freelancer" },
  { name: "Your name here", role: "Agency owner" },
  { name: "Your name here", role: "Consultant" },
];

export default function LandingPage() {
  return (
    <PublicPageShell>
      <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.18),_transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Connect your inbox. Build your sequence. Start closing.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-body sm:text-xl">
            MailThur sends cold emails from your own Gmail account, handles
            follow-ups automatically, and tracks every open and reply, so you
            spend your time closing, not searching.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-lg border border-border-subtle px-6 py-3 text-sm font-semibold text-white hover:border-accent/40 hover:bg-accent/5"
            >
              See How It Works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted sm:gap-6">
            <span>3-day free trial</span>
            <span className="hidden sm:inline">•</span>
            <span>No credit card required</span>
            <span className="hidden sm:inline">•</span>
            <span>Cancel anytime</span>
          </div>
          <div className="mt-12">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <section className="border-y border-border-subtle bg-surface/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-body">
            Join freelancers and agency owners already using MailThur to send
            smarter outreach.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-white">2M+</p>
              <p className="mt-1 text-sm text-muted">Emails sent</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">3%</p>
              <p className="mt-1 text-sm text-muted">Avg. reply rate benchmark</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">40+</p>
              <p className="mt-1 text-sm text-muted">Countries supported</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-border-subtle bg-surface p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-surface/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Built for serious outreach
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body">
            Everything you need to run professional cold email campaigns from
            your own inbox.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border-subtle bg-[#0D0F1A] p-6"
              >
                <feature.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-4 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-body">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body">
            Start with a 3-day free trial. Upgrade when you are ready to scale.
          </p>
          <div className="mt-12">
            <PlanCards signupHref="/dashboard" />
          </div>
          <div className="mt-8">
            <TrustBadges />
          </div>
          <div className="mt-12 overflow-hidden rounded-xl border border-border-subtle bg-surface p-6">
            <h3 className="text-lg font-semibold text-white">
              How MailThur compares
            </h3>
            <div className="mt-6">
              <ComparisonTable />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Trusted by outreach professionals
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-dashed border-border-subtle bg-[#0D0F1A] p-6"
              >
                <p className="text-sm italic text-body">
                  &ldquo;Testimonial coming soon.&rdquo;
                </p>
                <p className="mt-4 font-semibold text-white">{item.name}</p>
                <p className="text-sm text-muted">{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
