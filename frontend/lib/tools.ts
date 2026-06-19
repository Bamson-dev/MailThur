const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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

export async function checkDomain(domain: string): Promise<DomainCheckResult> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(`${apiUrl}/api/tools/domain-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ domain }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.error === "string"
        ? body.error
        : "Unable to check domain. Please try again.";
    throw new Error(message);
  }

  const data = (await response.json()) as { result: DomainCheckResult };
  return data.result;
}
