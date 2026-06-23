"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { checkDomain, DomainCheckResult } from "@/lib/tools";
import { getUserErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

function CheckRow({
  label,
  result,
}: {
  label: string;
  result: DomainCheckResult["spf"];
}) {
  const passed = result.status === "pass";

  return (
    <div className="border-b border-border-subtle py-4 last:border-0">
      <div className="flex items-start gap-3">
        {passed ? (
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        ) : (
          <X className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        )}
        <div>
          <p className={cn("font-medium", passed ? "text-success" : "text-danger")}>
            {label}
          </p>
          <p className="mt-1 text-sm text-body">{result.explanation}</p>
          {!passed && result.fix ? (
            <p className="mt-2 text-xs text-muted">{result.fix}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function DomainChecker() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DomainCheckResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await checkDomain(domain.trim());
      setResult(data);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 rounded-lg border border-border-subtle bg-content px-4 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check Domain"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {result ? (
        <div className="mt-6 rounded-xl border border-border-subtle bg-content px-4">
          <p className="border-b border-border-subtle py-3 text-sm font-medium text-white">
            Results for {result.domain}
          </p>
          <CheckRow label="SPF" result={result.spf} />
          <CheckRow label="DKIM" result={result.dkim} />
          <CheckRow label="DMARC" result={result.dmarc} />
        </div>
      ) : null}
    </div>
  );
}
