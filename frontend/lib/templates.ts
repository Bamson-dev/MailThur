import { StepInput } from "./campaigns";

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  open_rate_claim: number;
  reply_rate_claim: number;
  steps: StepInput[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "web-design",
    name: "Web Design",
    description: "Outreach for web design services",
    open_rate_claim: 34,
    reply_rate_claim: 8,
    steps: [
      {
        subject: "Quick question about {{business_name}}'s website",
        body: "Hi {{first_name}},\n\nI came across {{business_name}} while researching businesses in {{city}} and noticed your website could use some attention. I help businesses like yours get a clean, fast site that actually brings in customers.\n\nWould you be open to a quick chat?",
        delay_days: 0,
      },
    ],
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Social media management outreach",
    open_rate_claim: 32,
    reply_rate_claim: 7,
    steps: [
      {
        subject: "{{business_name}}'s social media",
        body: "Hi {{first_name}},\n\nI was looking at {{business_name}} online and noticed your social media presence could be stronger. I help local businesses in {{city}} stay consistent on Instagram and Facebook and drive more foot traffic.\n\nWant to see what that could look like for you?",
        delay_days: 0,
      },
    ],
  },
  {
    id: "seo",
    name: "SEO",
    description: "SEO services outreach",
    open_rate_claim: 36,
    reply_rate_claim: 9,
    steps: [
      {
        subject: "Found something about {{business_name}} on Google",
        body: "Hi {{first_name}},\n\nI came across {{business_name}} while doing some research in {{city}}. Noticed your Google ranking has some room to improve. I help businesses show up higher on Google without any technical headaches.\n\nWould a quick 10-minute call be worth it?",
        delay_days: 0,
      },
    ],
  },
  {
    id: "copywriting",
    name: "Copywriting",
    description: "Copywriting services outreach",
    open_rate_claim: 31,
    reply_rate_claim: 7,
    steps: [
      {
        subject: "Your website copy, {{business_name}}",
        body: "Hi {{first_name}},\n\nI checked out {{business_name}}'s website and think the messaging could do more to convert visitors. I write copy for businesses in {{city}} that actually gets people to take action.\n\nWant me to send over a quick example for your homepage?",
        delay_days: 0,
      },
    ],
  },
  {
    id: "cold-outreach",
    name: "Cold Outreach General",
    description: "General cold outreach sequence",
    open_rate_claim: 28,
    reply_rate_claim: 6,
    steps: [
      {
        subject: "Quick question, {{first_name}}",
        body: "Hi {{first_name}},\n\nI came across {{business_name}} while looking at businesses in {{city}} and wanted to reach out. I think I could help.\n\nDo you have 5 minutes this week for a quick call?",
        delay_days: 0,
      },
    ],
  },
  {
    id: "follow-up",
    name: "Follow Up",
    description: "Gentle follow-up sequence",
    open_rate_claim: 38,
    reply_rate_claim: 10,
    steps: [
      {
        subject: "Following up, {{first_name}}",
        body: "Hi {{first_name}},\n\nI wanted to follow up on my last message. I know things get busy. I genuinely think I can help {{business_name}} and would love just 10 minutes of your time.\n\nWould this week work?",
        delay_days: 0,
      },
    ],
  },
];
