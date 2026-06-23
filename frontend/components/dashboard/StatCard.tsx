import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";

type AccentColor = "accent" | "success" | "info" | "warning";

const ACCENT_STYLES: Record<
  AccentColor,
  { bar: string; icon: string }
> = {
  accent: { bar: "bg-accent", icon: "text-accent" },
  success: { bar: "bg-success", icon: "text-success" },
  info: { bar: "bg-info", icon: "text-info" },
  warning: { bar: "bg-warning", icon: "text-warning" },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: AccentColor;
  animate?: boolean;
  isPercentage?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "accent",
  animate = true,
  isPercentage = false,
  className,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  const numericValue =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-6",
        className
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1",
          styles.bar
        )}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-stat-label uppercase text-muted">{label}</p>
          <p className="mt-3 text-stat-number text-white">
            {animate && typeof value === "number" ? (
              <CountUp
                value={numericValue}
                decimals={isPercentage ? 1 : 0}
                suffix={isPercentage ? "%" : ""}
              />
            ) : (
              value
            )}
          </p>
        </div>
        <Icon className={cn("h-5 w-5", styles.icon)} strokeWidth={1.75} />
      </div>
    </div>
  );
}
