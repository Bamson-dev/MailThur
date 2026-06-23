import type { PlanId, UpgradePlan } from "./billing";

export const TRIAL_EMAIL_LIMIT = 500;
export const TRIAL_DAY_LIMIT = 3;

export interface PlanCard {
  id: PlanId;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  inboxes: string;
  monthlyEmails: string;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_CARDS: PlanCard[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    priceNote: "3 days",
    description: "Try MailThur with real campaigns before you commit.",
    inboxes: "1 inbox",
    monthlyEmails: "500 emails total",
    features: [
      "Full campaign builder",
      "Open & reply tracking",
      "CSV contact import",
      "MailThur branding on emails",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    priceNote: "/month",
    description: "For solo founders sending consistent outreach.",
    inboxes: "2 inboxes",
    monthlyEmails: "30,000 emails / month",
    features: [
      "Everything in trial",
      "No MailThur branding",
      "Priority sending queue",
      "Email support",
    ],
    highlighted: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$39",
    priceNote: "/month",
    description: "Scale outreach across multiple inboxes and teams.",
    inboxes: "6 inboxes",
    monthlyEmails: "Unlimited emails",
    features: [
      "Everything in Starter",
      "Higher deliverability limits",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$79",
    priceNote: "/month",
    description: "Run client campaigns with maximum capacity.",
    inboxes: "Unlimited inboxes",
    monthlyEmails: "Unlimited emails",
    features: [
      "Everything in Growth",
      "Unlimited inboxes",
      "Dedicated onboarding",
      "SLA support",
    ],
  },
];

export const COMPARISON_ROWS: Array<{
  label: string;
  trial: string;
  starter: string;
  growth: string;
  agency: string;
}> = [
  {
    label: "Connected inboxes",
    trial: "1",
    starter: "2",
    growth: "6",
    agency: "Unlimited",
  },
  {
    label: "Monthly email sends",
    trial: "500 (trial total)",
    starter: "30,000",
    growth: "Unlimited",
    agency: "Unlimited",
  },
  {
    label: "Trial duration",
    trial: "3 days",
    starter: "—",
    growth: "—",
    agency: "—",
  },
  {
    label: "Open tracking",
    trial: "✓",
    starter: "✓",
    growth: "✓",
    agency: "✓",
  },
  {
    label: "Reply detection",
    trial: "✓",
    starter: "✓",
    growth: "✓",
    agency: "✓",
  },
  {
    label: "Remove MailThur branding",
    trial: "—",
    starter: "✓",
    growth: "✓",
    agency: "✓",
  },
  {
    label: "Support",
    trial: "Community",
    starter: "Email",
    growth: "Priority",
    agency: "SLA",
  },
];

export const TRUST_BADGES = [
  "Paystack & Flutterwave secure checkout",
  "Cancel anytime from billing settings",
  "No hidden fees — price shown at checkout",
  "Gmail-native sending from your inbox",
];

export const UPGRADE_PLAN_IDS: UpgradePlan[] = ["starter", "growth", "agency"];
