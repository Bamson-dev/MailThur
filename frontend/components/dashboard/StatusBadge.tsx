import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "draft"
  | "paused"
  | "completed"
  | "sent"
  | "bounced"
  | "failed"
  | "disconnected"
  | "pending"
  | "in_progress"
  | "replied"
  | "unsubscribed"
  | "default";

const VARIANT_STYLES: Record<StatusVariant, string> = {
  active: "bg-success/10 text-success",
  sent: "bg-success/10 text-success",
  replied: "bg-info/10 text-info",
  draft: "bg-muted/10 text-muted",
  paused: "bg-warning/10 text-warning",
  pending: "bg-muted/10 text-muted",
  in_progress: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  bounced: "bg-danger/10 text-danger",
  failed: "bg-danger/10 text-danger",
  disconnected: "bg-muted/10 text-muted",
  unsubscribed: "bg-muted/10 text-muted",
  default: "bg-muted/10 text-muted",
};

function normalizeStatus(status: string): StatusVariant {
  const key = status.toLowerCase().replace(/\s+/g, "_") as StatusVariant;
  return key in VARIANT_STYLES ? key : "default";
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = normalizeStatus(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
