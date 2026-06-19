import dns from "dns/promises";
import { z } from "zod";

export const domainCheckBodySchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(253)
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Invalid domain format"
    ),
});

export type DomainCheckBody = z.infer<typeof domainCheckBodySchema>;

export interface DnsCheckResult {
  status: "pass" | "fail";
  explanation: string;
  fix?: string;
}

export interface DomainCheckResult {
  domain: string;
  spf: DnsCheckResult;
  dkim: DnsCheckResult;
  dmarc: DnsCheckResult;
}

async function resolveTxtRecords(host: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(host);
    return records.map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

function checkSpf(records: string[]): DnsCheckResult {
  const spf = records.find((r) => r.toLowerCase().startsWith("v=spf1"));
  if (spf) {
    return {
      status: "pass",
      explanation: "SPF record found for this domain.",
    };
  }
  return {
    status: "fail",
    explanation: "No SPF record found on this domain.",
    fix: 'Add a TXT record to your DNS with value: v=spf1 include:_spf.google.com ~all',
  };
}

async function checkDkimAsync(domain: string): Promise<DnsCheckResult> {
  const selectors = ["google", "default", "selector1", "selector2", "k1"];
  for (const selector of selectors) {
    const host = `${selector}._domainkey.${domain}`;
    const records = await resolveTxtRecords(host);
    const dkim = records.find((r) => r.includes("v=DKIM1") || r.includes("p="));
    if (dkim) {
      return {
        status: "pass",
        explanation: `DKIM record found (${selector} selector).`,
      };
    }
  }

  return {
    status: "fail",
    explanation: "No DKIM record found for common selectors.",
    fix: "Enable DKIM in your email provider (e.g. Google Workspace Admin) and publish the provided TXT record.",
  };
}

function checkDmarc(records: string[]): DnsCheckResult {
  const dmarc = records.find((r) => r.toUpperCase().startsWith("V=DMARC1"));
  if (dmarc) {
    return {
      status: "pass",
      explanation: "DMARC record found for this domain.",
    };
  }
  return {
    status: "fail",
    explanation: "No DMARC record found at _dmarc.",
    fix: "Add a TXT record at _dmarc.yourdomain.com with value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com",
  };
}

export async function checkDomainDns(domain: string): Promise<DomainCheckResult> {
  const normalized = domain.toLowerCase().replace(/^www\./, "");

  const [rootTxt, dmarcTxt, dkimResult] = await Promise.all([
    resolveTxtRecords(normalized),
    resolveTxtRecords(`_dmarc.${normalized}`),
    checkDkimAsync(normalized),
  ]);

  return {
    domain: normalized,
    spf: checkSpf(rootTxt),
    dkim: dkimResult,
    dmarc: checkDmarc(dmarcTxt),
  };
}
