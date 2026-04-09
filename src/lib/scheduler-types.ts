export const SCHEDULER_API =
  process.env.NEXT_PUBLIC_SCHEDULER_URL ?? "http://localhost:8787";

export interface ScheduleResult {
  id: string;
  status: string;
  validAfter: number;
  validBefore: number | null;
  estimatedBroadcast: string;
}

export interface ScheduleStatus {
  id: string;
  owner: string;
  status: string;
  validAfter: number;
  validBefore: number | null;
  txHash: string | null;
  error: string | null;
  createdAt: number;
  memo: string | null;
}

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-step-challenge/20 text-step-challenge",
  submitted: "bg-step-receipt/20 text-step-receipt",
  failed: "bg-destructive/20 text-destructive",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

export function toLocalDatetime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}
