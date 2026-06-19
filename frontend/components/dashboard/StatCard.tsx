import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-card-border bg-card p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {trend ? (
            <p className="mt-1 text-xs text-muted">{trend}</p>
          ) : null}
        </div>
        <div className="rounded-lg bg-accent/10 p-2.5">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  );
}
