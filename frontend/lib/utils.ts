export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function capBarColor(pct: number): string {
  if (pct > 80) return "bg-danger";
  if (pct > 50) return "bg-warning";
  return "bg-accent";
}

export function bounceColor(rate: number): {
  text: string;
  dot: string;
} {
  if (rate > 5) return { text: "text-danger", dot: "bg-danger" };
  if (rate >= 3) return { text: "text-warning", dot: "bg-warning" };
  return { text: "text-success", dot: "bg-success" };
}

export function activityDotColor(
  status: string,
  openedAt: string | null
): string {
  if (status === "bounced") return "bg-danger";
  if (status === "unsubscribed") return "bg-muted";
  if (openedAt) return "bg-warning";
  if (status === "sent") return "bg-success";
  return "bg-info";
}
