import { StepInput } from "./campaigns";

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  steps: StepInput[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "web-design",
    name: "Web Design",
    description: "Outreach for web design services",
    steps: [
      {
        subject: "Quick question about {{business_name}}'s website",
        body: "Hi {{first_name}},\n\nI came across {{business_name}} in {{city}} and noticed your website could use a refresh. We help local businesses improve their online presence.\n\nWould you be open to a quick chat this week?\n\nBest,",
        delay_days: 0,
      },
      {
        subject: "Re: {{business_name}} website",
        body: "Hi {{first_name}},\n\nJust following up on my note about {{business_name}}. Happy to share a few ideas — no obligation.\n\nBest,",
        delay_days: 3,
      },
    ],
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Social media management outreach",
    steps: [
      {
        subject: "Growing {{business_name}} on social",
        body: "Hi {{first_name}},\n\nI help businesses in {{city}} like {{business_name}} grow their social presence without adding to your workload.\n\nInterested in learning more?\n\nBest,",
        delay_days: 0,
      },
      {
        subject: "Following up — {{business_name}}",
        body: "Hi {{first_name}},\n\nWanted to bump this up in your inbox. Happy to send a quick audit of your current social channels.\n\nBest,",
        delay_days: 4,
      },
    ],
  },
  {
    id: "seo",
    name: "SEO",
    description: "SEO services outreach",
    steps: [
      {
        subject: "{{business_name}} + local search in {{city}}",
        body: "Hi {{first_name}},\n\nI noticed {{business_name}} could rank higher for local searches in {{city}}. We specialize in SEO for small businesses.\n\nOpen to a brief call?\n\nBest,",
        delay_days: 0,
      },
      {
        subject: "Re: local SEO for {{business_name}}",
        body: "Hi {{first_name}},\n\nFollowing up — I can share 2–3 quick wins for {{business_name}}'s search visibility.\n\nBest,",
        delay_days: 5,
      },
    ],
  },
  {
    id: "copywriting",
    name: "Copywriting",
    description: "Copywriting services outreach",
    steps: [
      {
        subject: "Copy for {{business_name}}",
        body: "Hi {{first_name}},\n\nI'm a copywriter who works with businesses in {{city}}. I'd love to help {{business_name}} communicate more clearly with your customers.\n\nWould a quick intro call work?\n\nBest,",
        delay_days: 0,
      },
      {
        subject: "Re: {{business_name}} messaging",
        body: "Hi {{first_name}},\n\nBumping this — happy to review your site copy and share suggestions at no cost.\n\nBest,",
        delay_days: 3,
      },
    ],
  },
  {
    id: "cold-outreach",
    name: "Cold Outreach General",
    description: "General cold outreach sequence",
    steps: [
      {
        subject: "Quick intro — {{first_name}}",
        body: "Hi {{first_name}},\n\nI came across {{business_name}} in {{city}} and thought there might be a fit to work together.\n\nDo you have 15 minutes this week?\n\nBest,",
        delay_days: 0,
      },
      {
        subject: "Following up",
        body: "Hi {{first_name}},\n\nJust wanted to follow up on my previous email. Let me know if you'd like to connect.\n\nBest,",
        delay_days: 4,
      },
      {
        subject: "Last note",
        body: "Hi {{first_name}},\n\nI'll keep this brief — if timing isn't right, no worries at all. Feel free to reach out whenever.\n\nBest,",
        delay_days: 7,
      },
    ],
  },
  {
    id: "follow-up",
    name: "Follow Up",
    description: "Gentle follow-up sequence",
    steps: [
      {
        subject: "Checking in — {{business_name}}",
        body: "Hi {{first_name}},\n\nWanted to check in and see if you had a chance to review my last note about {{business_name}}.\n\nBest,",
        delay_days: 0,
      },
      {
        subject: "One more follow up",
        body: "Hi {{first_name}},\n\nI know inboxes get busy. If this isn't a priority right now, just let me know and I won't follow up again.\n\nBest,",
        delay_days: 5,
      },
    ],
  },
];
