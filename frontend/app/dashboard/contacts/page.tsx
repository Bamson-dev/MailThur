"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Users } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import {
  exportContactsCsv,
  fetchContacts,
  UnifiedContact,
} from "@/lib/contacts";
import { getUserErrorMessage } from "@/lib/api";

export default function ContactsPage() {
  const { toast } = useToast();
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

  function handleExport() {
    exportContactsCsv(contacts);
    toast(`Exported ${contacts.length} contact(s)`);
  }

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Contacts"
        description="All contacts across your campaigns"
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm text-white hover:bg-surface disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-border-subtle p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or business..."
              className="flex-1 rounded-lg border border-border-subtle bg-content px-4 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border-subtle bg-content px-4 py-2 text-sm text-white"
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
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-white hover:bg-content"
            >
              Apply
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description="Import contacts via CSV when creating a campaign, or adjust your search filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border-subtle text-left">
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Email
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Business
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    City
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Last contacted
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border-subtle bg-surface hover:bg-row-hover"
                  >
                    <td className="px-4 py-3 text-white">
                      {contact.campaign_name}
                    </td>
                    <td className="px-4 py-3 text-body">{contact.email}</td>
                    <td className="px-4 py-3 text-body">
                      {contact.business_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {contact.city ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contact.status} />
                    </td>
                    <td className="px-4 py-3 text-body">
                      {contact.last_contacted_at
                        ? new Date(contact.last_contacted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {contact.opened ? (
                        <span className="text-warning">Opened</span>
                      ) : (
                        "—"
                      )}
                      {contact.replied ? (
                        <span className="text-info"> · Replied</span>
                      ) : null}
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
