export const MAX_DAILY_SEND_CAP = 200;

export type WarmupStage =
  | "building"
  | "growing"
  | "almost"
  | "fully";

export function getWarmupPercent(dailySendCap: number): number {
  if (dailySendCap <= 0) return 0;
  return Math.min(100, (dailySendCap / MAX_DAILY_SEND_CAP) * 100);
}

export function getWarmupStage(percent: number): WarmupStage {
  if (percent <= 25) return "building";
  if (percent <= 60) return "growing";
  if (percent <= 90) return "almost";
  return "fully";
}

export function getWarmupStageLabel(stage: WarmupStage): string {
  switch (stage) {
    case "building":
      return "Building reputation";
    case "growing":
      return "Growing steadily";
    case "almost":
      return "Almost warmed up";
    case "fully":
      return "Fully warmed";
  }
}

export function getWarmupStageColor(stage: WarmupStage): string {
  switch (stage) {
    case "building":
      return "text-warning";
    case "growing":
      return "text-yellow-400";
    case "almost":
      return "text-info";
    case "fully":
      return "text-success";
  }
}

export function getWarmupStageAdvice(stage: WarmupStage): string {
  switch (stage) {
    case "building":
      return "Keep sending consistently to build your reputation";
    case "growing":
      return "Your inbox health is improving. Stay consistent.";
    case "almost":
      return "Nearly there. Maintain your current sending pace.";
    case "fully":
      return "Your inbox is healthy and fully warmed. Maximize your outreach.";
  }
}
