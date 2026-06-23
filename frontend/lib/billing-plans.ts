import type { PlanId, UpgradePlan } from "./billing";

export const TRIAL_EMAIL_LIMIT = 500;
export const TRIAL_DAY_LIMIT = 3;

export interface PlanCardData {
  id: PlanId | "enterprise";
  name: string;
  price?: string;
  headline: string;
  features: string[];
  valueLine?: string;
  highlighted?: boolean;
  isEnterprise?: boolean;
  whatsappMessage?: string;
}

export const PAID_PLAN_CARDS: PlanCardData[] = [
  {
    id: "starter",
    name: "Starter",
    price: "₦25,000 per month",
    headline: "Start closing more clients",
    features: [
      "Unlimited connected inboxes",
      "30,000 emails per month",
      "Full campaign builder with sequences",
      "Basic analytics and open tracking",
      "Reply detection",
      "Unsubscribe handling",
      "MailThur branding removed",
    ],
    valueLine:
      "At a 3% reply rate, 30,000 emails means 900 potential conversations per month",
  },
  {
    id: "growth",
    name: "Growth",
    price: "₦50,000 per month",
    headline: "Scale without limits",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Unlimited emails per month",
      "Advanced analytics and deliverability scoring",
      "Domain health checker",
      "Inbox deliverability grade A to F",
      "Priority email support",
    ],
    valueLine: "No monthly cap. Send as much as your inboxes allow.",
  },
  {
    id: "agency",
    name: "Agency",
    price: "₦75,000 per month",
    headline: "Run outreach for multiple clients",
    features: [
      "Everything in Growth",
      "Unlimited client workspaces",
      "White label dashboard",
      "Dedicated support within 24 hours",
      "Early access to new features",
    ],
    valueLine:
      "Manage all your clients from one dashboard without them seeing each other's data.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    headline: "Need something custom?",
    isEnterprise: true,
    features: [
      "Custom sending limits",
      "Custom onboarding and setup",
      "SLA guarantee",
      "Dedicated account manager",
      "API access for custom integrations",
    ],
    whatsappMessage:
      "Hi, I am interested in MailThur Enterprise. Please tell me more.",
  },
];

export const TRUST_BADGES = [
  "3-day free trial no card required",
  "30-day money back guarantee on first payment",
  "Cancel anytime no questions asked",
];

export const COMPETITOR_COMPARISON: Array<{
  feature: string;
  mailthur: string;
  instantly: string;
  smartlead: string;
  positive?: "mailthur" | "instantly" | "smartlead" | "none";
}> = [
  {
    feature: "Monthly price (NGN equiv. @ ₦1,600/$)",
    mailthur: "₦25,000",
    instantly: "₦155,200 (~$97)",
    smartlead: "₦124,800 (~$78)",
    positive: "mailthur",
  },
  {
    feature: "Unlimited inboxes",
    mailthur: "yes",
    instantly: "yes",
    smartlead: "yes",
    positive: "none",
  },
  {
    feature: "Monthly email cap",
    mailthur: "30,000 (Starter)",
    instantly: "Unlimited",
    smartlead: "Unlimited",
    positive: "none",
  },
  {
    feature: "Free trial available",
    mailthur: "yes",
    instantly: "no",
    smartlead: "no",
    positive: "mailthur",
  },
  {
    feature: "Money back guarantee",
    mailthur: "yes",
    instantly: "no",
    smartlead: "no",
    positive: "mailthur",
  },
  {
    feature: "Local NGN pricing",
    mailthur: "yes",
    instantly: "no",
    smartlead: "no",
    positive: "mailthur",
  },
];

export const UPGRADE_PLAN_IDS: UpgradePlan[] = ["starter", "growth", "agency"];

export const ENTERPRISE_WHATSAPP_URL =
  "https://wa.me/2349067285890?text=Hi%2C%20I%20am%20interested%20in%20MailThur%20Enterprise.%20Please%20tell%20me%20more.";
