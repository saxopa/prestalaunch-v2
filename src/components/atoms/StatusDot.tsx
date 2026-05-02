import type { SiteStatus } from "@/types/site";

interface Props {
  status: SiteStatus;
  size?: "sm" | "lg";
}

const colorMap: Record<SiteStatus, string> = {
  running: "bg-success animate-pulse",
  stopped: "bg-slate-600",
  starting: "bg-warning animate-pulse",
  error: "bg-danger",
};

export function StatusDot({ status, size = "sm" }: Props) {
  return (
    <span className={`inline-block rounded-full flex-shrink-0 ${colorMap[status]} ${size === "lg" ? "w-3 h-3" : "w-2 h-2"}`} />
  );
}
