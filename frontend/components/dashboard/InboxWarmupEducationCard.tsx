import { ShieldCheck, TrendingUp } from "lucide-react";

export default function InboxWarmupEducationCard() {
  return (
    <div className="mt-6 rounded-xl border border-border-subtle border-l-[3px] border-l-accent bg-[#0D0F1A] p-4 text-left">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <ShieldCheck className="h-4 w-4 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white">
            Your inbox is connected and warming up.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-body">
            MailThur protects your Gmail account by gradually building your daily
            sending volume over the first few weeks. This builds your sender
            reputation so your emails land in inboxes, not spam. Your sending
            limit increases automatically as your account builds trust. Connect
            more inboxes to multiply your daily volume while each one warms up
            safely.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs text-muted">Inbox warmup</p>
          </div>
          <p className="text-xs font-medium text-warning">Building reputation</p>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
          <div
            className="h-full rounded-full bg-accent/70 transition-all"
            style={{ width: "10%" }}
          />
        </div>
      </div>
    </div>
  );
}
