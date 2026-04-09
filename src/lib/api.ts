import type { HttpMethod } from "@/components/probe-input";
import type { ChallengeData } from "./types";

/** Methods that are allowed to carry a request body. */
const METHODS_WITH_BODY: readonly HttpMethod[] = ["POST", "PUT", "PATCH"];

function hasBody(method: HttpMethod): boolean {
  return METHODS_WITH_BODY.includes(method);
}

export interface ProbeRequest {
  url: string;
  method: HttpMethod;
  body?: string;
}

export interface ProbeResponse {
  mppEnabled: boolean;
  statusCode: number;
  challenge?: ChallengeData;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  body: unknown;
  rawWwwAuthenticate?: string;
  error?: string;
}

export interface PayRequest {
  url: string;
  credential: string;
  method: HttpMethod;
  body?: string;
}

export interface PayResponse {
  statusCode: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  body: unknown;
  receipt?: unknown;
  error?: string;
}

/**
 * Proxy the probe request through our `/api/probe` route.
 * The API route forwards the request to the target and returns the
 * raw response so we can render the 402 challenge step-by-step.
 */
export async function probeEndpoint(
  req: ProbeRequest,
): Promise<ProbeResponse> {
  const res = await fetch("/api/probe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: req.url,
      method: req.method,
      ...(req.body && hasBody(req.method) ? { body: req.body } : {}),
    }),
  });

  const result: ProbeResponse = await res.json();
  if (!res.ok) {
    throw new Error(result.error ?? "Probe failed");
  }
  return result;
}

/**
 * Retry the original request with a signed payment credential.
 * The `/api/pay` route forwards the request and returns the final
 * response plus the decoded `Payment-Receipt` header.
 */
export async function payEndpoint(req: PayRequest): Promise<PayResponse> {
  const res = await fetch("/api/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: req.url,
      credential: req.credential,
      method: req.method,
      ...(req.body && hasBody(req.method) ? { body: req.body } : {}),
    }),
  });

  const result: PayResponse = await res.json();
  if (!res.ok) {
    throw new Error(result.error ?? "Payment failed");
  }
  return result;
}
