import {
  getWarmupPercent,
  getWarmupStage,
  getWarmupStageAdvice,
  getWarmupStageColor,
  getWarmupStageLabel,
} from "@/lib/inbox-warmup";

interface InboxWarmupProgressProps {
  dailySendCap: number;
}

export default function InboxWarmupProgress({
  dailySendCap,
}: InboxWarmupProgressProps) {
  const percent = getWarmupPercent(dailySendCap);
  const stage = getWarmupStage(percent);
  const label = getWarmupStageLabel(stage);
  const labelColor = getWarmupStageColor(stage);
  const advice = getWarmupStageAdvice(stage);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">Warmup progress</p>
        <p className={`text-xs font-medium ${labelColor}`}>{label}</p>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full rounded-full bg-accent/70 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-body">{advice}</p>
    </div>
  );
}
