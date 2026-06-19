import { cn } from "@/lib/utils";

interface MetricBarProps {
  value: number;
  color: "success" | "info" | "warning" | "danger" | "accent";
  className?: string;
}

const COLORS = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
};

export default function MetricBar({ value, color, className }: MetricBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("mt-1 h-1 w-full overflow-hidden rounded-full bg-border-subtle", className)}>
      <div
        className={cn("h-full rounded-full transition-all", COLORS[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
