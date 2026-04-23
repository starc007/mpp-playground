import { parseUnits, formatUnits } from "viem";
import { TIP20_DECIMALS, TEMPO_CURRENCIES } from "./currencies";

export type AccessKeyStatus = "active" | "expiring" | "expired";

export interface SpendingLimit {
  token: `0x${string}`;
  amount: string; // human-readable, in token units
}

export interface AccessKeyEntry {
  /** Access key address (the derived pubkey address) */
  address: `0x${string}`;
  /** Root account address that owns the key */
  ownerAddress: `0x${string}`;
  /** Unix timestamp (seconds) when the key expires */
  expiry?: number;
  /** Spending limits (token + amount as bigint in raw units) */
  limits?: Array<{
    token: `0x${string}`;
    limit: bigint;
    /** Period in seconds. Undefined = lifetime (cumulative) limit. */
    period?: number;
  }>;
  keyType: "secp256k1" | "p256" | "webAuthn" | "webCrypto";
}

export function getKeyStatus(expiry?: number): AccessKeyStatus {
  if (!expiry) return "active";
  const now = Math.floor(Date.now() / 1000);
  if (expiry <= now) return "expired";
  if (expiry - now < 48 * 3600) return "expiring";
  return "active";
}

export function formatExpiry(expiry?: number): string {
  if (!expiry) return "no expiry";
  return new Date(expiry * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseLimitAmount(amount: string): bigint {
  if (!amount) return 0n;
  return parseUnits(amount, TIP20_DECIMALS);
}

export function formatLimitAmount(amount: bigint): string {
  return formatUnits(amount, TIP20_DECIMALS);
}

export function getTokenLabel(address: `0x${string}`): string {
  const match = TEMPO_CURRENCIES.find(
    (c) => c.address.toLowerCase() === address.toLowerCase(),
  );
  return match?.label ?? `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Expiry presets in days */
export const EXPIRY_PRESETS = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export function expiryFromDays(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 86400;
}

/** Period presets for per-period spending limits (seconds). */
export const PERIOD_PRESETS = [
  { label: "Lifetime", value: "lifetime", seconds: undefined },
  { label: "Per hour", value: "hour", seconds: 3600 },
  { label: "Per day", value: "day", seconds: 86400 },
  { label: "Per week", value: "week", seconds: 604800 },
  { label: "Per month", value: "month", seconds: 2592000 },
] as const;

export type PeriodValue = (typeof PERIOD_PRESETS)[number]["value"];

export function formatPeriod(periodSeconds?: number): string {
  if (!periodSeconds) return "lifetime";
  const match = PERIOD_PRESETS.find((p) => p.seconds === periodSeconds);
  if (match) return match.label.replace(/^Per /, "/ ");
  // Fallback for arbitrary custom periods
  if (periodSeconds % 86400 === 0) return `/ ${periodSeconds / 86400}d`;
  if (periodSeconds % 3600 === 0) return `/ ${periodSeconds / 3600}h`;
  return `/ ${periodSeconds}s`;
}

export function periodValueToSeconds(value: PeriodValue): number | undefined {
  return PERIOD_PRESETS.find((p) => p.value === value)?.seconds;
}

export function secondsToPeriodValue(
  periodSeconds?: number,
): PeriodValue {
  if (!periodSeconds) return "lifetime";
  const match = PERIOD_PRESETS.find((p) => p.seconds === periodSeconds);
  return match?.value ?? "lifetime";
}
