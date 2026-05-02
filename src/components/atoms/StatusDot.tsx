import type { SiteStatus } from "@/types/site";

interface Props {
  status: SiteStatus;
}

const colorMap: Record<SiteStatus, string> = {
  running: "bg-success animate-pulse",
  stopped: "bg-slate-600",
  starting: "bg-warning animate-pulse",
  error: "bg-danger",
};

export function StatusDot({ status }: Props) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colorMap[status]}`} />
  );
}
