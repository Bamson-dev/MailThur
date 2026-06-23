import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  active: {
    bg: "bg-success/15",
    text: "text-success",
    label: "Active",
  },
  sent: {
    bg: "bg-success/15",
    text: "text-success",
    label: "Sent",
  },
  draft: {
    bg: "bg-info/15",
    text: "text-info",
    label: "Draft",
  },
  paused: {
    bg: "bg-warning/15",
    text: "text-warning",
    label: "Paused",
  },
  completed: {
    bg: "bg-muted/15",
    text: "text-muted",
    label: "Completed",
  },
  bounced: {
    bg: "bg-danger/15",
    text: "text-danger",
    label: "Bounced",
  },
  failed: {
    bg: "bg-danger/15",
    text: "text-danger",
    label: "Failed",
  },
  unsubscribed: {
    bg: "bg-muted/15",
    text: "text-muted",
    label: "Unsubscribed",
  },
  replied: {
    bg: "bg-info/15",
    text: "text-info",
    label: "Replied",
  },
  opened: {
    bg: "bg-warning/15",
    text: "text-warning",
    label: "Opened",
  },
  pending: {
    bg: "bg-info/15",
    text: "text-info",
    label: "Pending",
  },
  disconnected: {
    bg: "bg-muted/15",
    text: "text-muted",
    label: "Disconnected",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const style = STATUS_STYLES[key] ?? {
    bg: "bg-muted/15",
    text: "text-muted",
    label: status,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
