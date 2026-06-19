"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  exportContactsCsv,
  fetchContacts,
  UnifiedContact,
} from "@/lib/contacts";
import { getUserErrorMessage } from "@/lib/api";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContacts({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setContacts(data);
      setError("");
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Contacts"
        description="All contacts across your campaigns"
        actions={
          <button
            type="button"
            onClick={() => exportContactsCsv(contacts)}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 rounded-lg border border-card-border px-4 py-2 text-sm text-white hover:bg-card disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or business..."
            className="flex-1 rounded-lg border border-card-border bg-content px-4 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-card-border bg-content px-4 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="replied">Replied</option>
            <option value="bounced">Bounced</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-white hover:bg-content"
          >
            Apply
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading contacts...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-danger">{error}</p>
        ) : contacts.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No contacts found.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-muted">
                  <th className="pb-3 pr-4 font-medium">Campaign</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Business</th>
                  <th className="pb-3 pr-4 font-medium">City</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Last contacted</th>
                  <th className="pb-3 font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="py-3 pr-4 text-white">
                      {contact.campaign_name}
                    </td>
                    <td className="py-3 pr-4 text-muted">{contact.email}</td>
                    <td className="py-3 pr-4 text-muted">
                      {contact.business_name ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {contact.city ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={contact.status} />
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {contact.last_contacted_at
                        ? new Date(contact.last_contacted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 text-xs text-muted">
                      {contact.opened ? "Opened" : "—"}
                      {contact.replied ? " · Replied" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AuthGate>
  );
}
