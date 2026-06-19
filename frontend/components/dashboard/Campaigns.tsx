"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getUserErrorMessage } from "@/lib/api";
import {
  Campaign,
  CampaignStep,
  StepInput,
  createCampaign,
  fetchCampaign,
  fetchCampaigns,
  importCampaignCsv,
  launchCampaign,
  pauseCampaign,
  saveCampaignSteps,
} from "@/lib/campaigns";
import { hasSession } from "@/lib/session";

const emptyStep = (): StepInput => ({
  subject: "",
  body: "",
  delay_days: 0,
});

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [steps, setSteps] = useState<StepInput[]>([emptyStep()]);
  const [savedSteps, setSavedSteps] = useState<CampaignStep[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [status, setStatus] = useState<Campaign["status"]>("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [importSummary, setImportSummary] = useState("");

  const loadCampaigns = useCallback(async () => {
    if (!hasSession()) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampaignDetail = useCallback(async (id: string) => {
    try {
      const campaign = await fetchCampaign(id);
      setSelectedId(campaign.id);
      setCampaignName(campaign.name);
      setStatus(campaign.status);
      setContactCount(campaign.contact_count ?? 0);
      setSavedSteps(campaign.steps ?? []);
      setSteps(
        campaign.steps?.length
          ? campaign.steps.map((step) => ({
              subject: step.subject,
              body: step.body,
              delay_days: step.delay_days,
            }))
          : [emptyStep()]
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setActionMessage("");
    setErrorMessage("");

    try {
      const campaign = await createCampaign(campaignName.trim());
      setSelectedId(campaign.id);
      setStatus(campaign.status);
      setContactCount(0);
      setSavedSteps([]);
      setSteps([emptyStep()]);
      setActionMessage("Campaign created.");
      await loadCampaigns();
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function updateStep(index: number, field: keyof StepInput, value: string) {
    setSteps((current) =>
      current.map((step, i) =>
        i === index
          ? {
              ...step,
              [field]:
                field === "delay_days" ? Number.parseInt(value, 10) || 0 : value,
            }
          : step
      )
    );
  }

  function addStep() {
    setSteps((current) => [...current, emptyStep()]);
  }

  function removeStep(index: number) {
    setSteps((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    );
  }

  async function handleSaveSteps() {
    if (!selectedId) {
      setErrorMessage("Create a campaign first.");
      return;
    }

    setSaving(true);
    setActionMessage("");
    setErrorMessage("");

    try {
      const saved = await saveCampaignSteps(selectedId, steps);
      setSavedSteps(saved);
      setActionMessage("Sequence saved.");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvImport(file: File | undefined) {
    if (!selectedId || !file) {
      return;
    }

    setImporting(true);
    setActionMessage("");
    setErrorMessage("");
    setImportSummary("");

    try {
      const result = await importCampaignCsv(selectedId, file);
      setContactCount((count) => count + result.imported);
      setImportSummary(
        `Imported ${result.imported} contact(s). Skipped ${result.skipped} invalid row(s).`
      );
      setActionMessage("Contacts imported.");
      await loadCampaigns();
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    } finally {
      setImporting(false);
    }
  }

  async function handleLaunch() {
    if (!selectedId) {
      return;
    }

    setLaunching(true);
    setActionMessage("");
    setErrorMessage("");

    try {
      await launchCampaign(selectedId);
      setStatus("active");
      setActionMessage("Campaign launched.");
      await loadCampaigns();
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    } finally {
      setLaunching(false);
    }
  }

  async function handlePause() {
    if (!selectedId) {
      return;
    }

    setLaunching(true);
    setActionMessage("");
    setErrorMessage("");

    try {
      await pauseCampaign(selectedId);
      setStatus("paused");
      setActionMessage("Campaign paused.");
      await loadCampaigns();
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    } finally {
      setLaunching(false);
    }
  }

  const canLaunch =
    !!selectedId &&
    savedSteps.length > 0 &&
    contactCount > 0 &&
    status !== "active";

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          <p className="mt-2 text-sm text-gray-600">
            Build sequences, import contacts, and launch outreach.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setCampaignName("");
            setSteps([emptyStep()]);
            setSavedSteps([]);
            setContactCount(0);
            setStatus("draft");
            setImportSummary("");
            setActionMessage("");
            setErrorMessage("");
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New Campaign
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Your campaigns
        </h3>
        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No campaigns yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <button
                  type="button"
                  onClick={() => loadCampaignDetail(campaign.id)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.status} · {campaign.contact_count ?? 0} contacts
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleCreateCampaign} className="mt-10 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Campaign builder
        </h3>
        <input
          type="text"
          value={campaignName}
          onChange={(event) => setCampaignName(event.target.value)}
          placeholder="Campaign name"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={saving || !campaignName.trim()}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {selectedId ? "Update name via new campaign" : "Create campaign"}
        </button>
      </form>

      {selectedId ? (
        <div className="mt-10 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Sequence steps
            </h3>
            <div className="mt-4 space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      Step {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={step.subject}
                    onChange={(event) =>
                      updateStep(index, "subject", event.target.value)
                    }
                    placeholder="Email subject"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900"
                  />
                  <textarea
                    value={step.body}
                    onChange={(event) =>
                      updateStep(index, "body", event.target.value)
                    }
                    placeholder="Email body — use {{first_name}}, {{business_name}}, {{city}}"
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Delay before send (days)
                    <input
                      type="number"
                      min={0}
                      value={step.delay_days}
                      onChange={(event) =>
                        updateStep(index, "delay_days", event.target.value)
                      }
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={addStep}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add step
              </button>
              <button
                type="button"
                onClick={handleSaveSteps}
                disabled={saving}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Save sequence
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Import contacts
            </h3>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={importing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleCsvImport(file);
                event.target.value = "";
              }}
              className="mt-4 block w-full text-sm text-gray-600"
            />
            {importSummary ? (
              <p className="mt-2 text-sm text-gray-600">{importSummary}</p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={!canLaunch || launching}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
            >
              Launch campaign
            </button>
            {status === "active" ? (
              <button
                type="button"
                onClick={handlePause}
                disabled={launching}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Pause campaign
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {actionMessage ? (
        <p className="mt-6 text-sm text-green-700">{actionMessage}</p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
