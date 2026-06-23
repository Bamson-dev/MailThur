"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Italic,
  Sparkles,
} from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  createCampaign,
  importCampaignCsv,
  launchCampaign,
  saveCampaignSteps,
  StepInput,
} from "@/lib/campaigns";
import { EMAIL_TEMPLATES } from "@/lib/templates";
import { getUserErrorMessage } from "@/lib/api";
import { useToast } from "@/components/dashboard/ToastProvider";

const TOKENS = ["{{first_name}}", "{{business_name}}", "{{city}}"];

const emptyStep = (): StepInput => ({
  subject: "",
  body: "",
  delay_days: 0,
});

const STEPS = ["Name", "Sequence", "Contacts", "Review"];

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [sequence, setSequence] = useState<StepInput[]>([emptyStep()]);
  const [activeBodyIndex, setActiveBodyIndex] = useState(0);
  const [importSummary, setImportSummary] = useState("");
  const [contactCount, setContactCount] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bodyRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  function updateStepField(
    index: number,
    field: keyof StepInput,
    value: string | number
  ) {
    setSequence((current) =>
      current.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    );
  }

  function insertToken(token: string) {
    const textarea = bodyRefs.current[activeBodyIndex];
    const current = sequence[activeBodyIndex]?.body ?? "";
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next =
        current.slice(0, start) + token + current.slice(end);
      updateStepField(activeBodyIndex, "body", next);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + token.length,
          start + token.length
        );
      });
    } else {
      updateStepField(activeBodyIndex, "body", current + token);
    }
  }

  function wrapSelection(wrapper: "**" | "*") {
    const textarea = bodyRefs.current[activeBodyIndex];
    const current = sequence[activeBodyIndex]?.body ?? "";
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = current.slice(start, end);
    const wrapped = `${wrapper}${selected || "text"}${wrapper}`;
    const next = current.slice(0, start) + wrapped + current.slice(end);
    updateStepField(activeBodyIndex, "body", next);
  }

  async function handleNext() {
    setError("");
    setLoading(true);
    try {
      if (step === 0) {
        if (!name.trim()) {
          setError("Campaign name is required.");
          return;
        }
        const campaign = await createCampaign(name.trim());
        setCampaignId(campaign.id);
        toast("Campaign created");
      } else if (step === 1 && campaignId) {
        await saveCampaignSteps(campaignId, sequence);
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvImport(file: File | undefined) {
    if (!campaignId || !file) return;
    setLoading(true);
    setError("");
    try {
      const result = await importCampaignCsv(campaignId, file);
      setContactCount((c) => c + result.imported);
      setImportSummary(
        `Imported ${result.imported} contact(s). Skipped ${result.skipped} invalid row(s).`
      );
      toast(`Imported ${result.imported} contact(s)`);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch() {
    if (!campaignId) return;
    setLoading(true);
    setError("");
    try {
      await launchCampaign(campaignId);
      toast("Campaign launched");
      router.push(`/dashboard/campaigns/${campaignId}`);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(templateId: string) {
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSequence(template.steps.map((s) => ({ ...s })));
      setShowTemplates(false);
    }
  }

  return (
    <AuthGate>
      <DashboardHeader
        title="New Campaign"
        description={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
      />

      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-accent" : "bg-card-border"
            }`}
          />
        ))}
      </div>

      <Card>
        {step === 0 ? (
          <div>
            <label className="text-sm font-medium text-white">
              Campaign name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 Outreach"
              className="mt-2 w-full rounded-lg border border-card-border bg-content px-4 py-2.5 text-white focus:border-accent focus:outline-none"
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Email sequence
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs text-white hover:bg-content"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Templates
              </button>
            </div>
            <div className="space-y-6">
              {sequence.map((seqStep, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-card-border bg-content p-4"
                >
                  <p className="text-xs font-medium text-accent">
                    Step {index + 1}
                  </p>
                  <input
                    type="text"
                    value={seqStep.subject}
                    onChange={(e) =>
                      updateStepField(index, "subject", e.target.value)
                    }
                    placeholder="Subject line"
                    className="mt-2 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-white"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBodyIndex(index);
                        wrapSelection("**");
                      }}
                      className="rounded border border-card-border p-1.5 text-muted hover:text-white"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBodyIndex(index);
                        wrapSelection("*");
                      }}
                      className="rounded border border-card-border p-1.5 text-muted hover:text-white"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    {TOKENS.map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => {
                          setActiveBodyIndex(index);
                          insertToken(token);
                        }}
                        className="rounded border border-card-border px-2 py-1 text-xs text-accent hover:bg-card"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={(el) => {
                      bodyRefs.current[index] = el;
                    }}
                    value={seqStep.body}
                    onFocus={() => setActiveBodyIndex(index)}
                    onChange={(e) =>
                      updateStepField(index, "body", e.target.value)
                    }
                    rows={6}
                    placeholder="Email body..."
                    className="mt-2 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-white"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                    Delay (days)
                    <input
                      type="number"
                      min={0}
                      value={seqStep.delay_days}
                      onChange={(e) =>
                        updateStepField(
                          index,
                          "delay_days",
                          Number.parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-20 rounded border border-card-border bg-card px-2 py-1 text-white"
                    />
                  </label>
                  {sequence.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSequence((s) => s.filter((_, i) => i !== index))
                      }
                      className="mt-2 text-xs text-danger hover:underline"
                    >
                      Remove step
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSequence((s) => [...s, emptyStep()])}
              className="mt-4 text-sm text-accent hover:underline"
            >
              + Add step
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h3 className="text-sm font-semibold text-white">Import contacts</h3>
            <p className="mt-2 text-sm text-muted">
              Upload a CSV with columns: email, first_name, business_name, city
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={loading}
              onChange={(e) => {
                void handleCsvImport(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="mt-4 block w-full text-sm text-muted"
            />
            {importSummary ? (
              <p className="mt-2 text-sm text-success">{importSummary}</p>
            ) : null}
            <div className="mt-6 rounded-lg border border-dashed border-card-border p-4 text-center">
              <p className="text-sm font-medium text-white">LeadThur</p>
              <p className="mt-1 text-xs text-muted">Coming Soon</p>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Review & launch
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Name</dt>
                <dd className="text-white">{name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Steps</dt>
                <dd className="text-white">{sequence.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Contacts</dt>
                <dd className="text-white">{contactCount}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={loading || contactCount === 0}
              className="mt-4 w-full rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-success/90 disabled:opacity-50"
            >
              {loading ? "Launching..." : "Launch campaign"}
            </button>
            <button
              type="button"
              onClick={() =>
                campaignId &&
                router.push(`/dashboard/campaigns/${campaignId}`)
              }
              className="w-full rounded-lg border border-card-border px-4 py-2.5 text-sm text-white hover:bg-content"
            >
              Save as draft
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        {step < 3 ? (
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-lg border border-card-border px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </Card>

      {showTemplates ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6">
            <h3 className="text-lg font-semibold text-white">
              Choose a template
            </h3>
            <p className="mt-2 text-xs text-muted">
              Open and reply rates are industry benchmarks and will vary based on
              your list quality, personalization, and sending reputation.
            </p>
            <ul className="mt-4 space-y-2">
              {EMAIL_TEMPLATES.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className="w-full rounded-lg border border-border-subtle bg-content px-4 py-3 text-left hover:border-accent"
                  >
                    <p className="font-medium text-white">{template.name}</p>
                    <p className="text-xs text-muted">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                        Avg {template.open_rate_claim}% open rate
                      </span>
                      <span className="rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                        Avg {template.reply_rate_claim}% reply rate
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="mt-4 w-full rounded-lg border border-border-subtle py-2 text-sm text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </AuthGate>
  );
}
