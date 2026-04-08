export type StepId = "request" | "challenge" | "pay" | "retry" | "receipt";

export type StepStatus = "idle" | "active" | "complete" | "error";

export interface Step {
  id: StepId;
  label: string;
  status: StepStatus;
  data?: StepData;
}

export interface StepData {
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  body?: unknown;
  statusCode?: number;
}

export interface ProbeResult {
  mppEnabled: boolean;
  statusCode: number;
  challenge?: ChallengeData;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  body?: unknown;
}

export interface ChallengeData {
  id: string;
  realm: string;
  method: string;
  intent: string;
  request: Record<string, unknown>;
  description?: string;
  expires?: string;
}

export interface PayResult {
  statusCode: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  body?: unknown;
  receipt?: ReceiptData;
}

export interface ReceiptData {
  method: string;
  reference: string;
  status: string;
  timestamp: string;
  externalId?: string;
}

export interface DetectionInfo {
  mppEnabled: boolean;
  method?: string;
  intent?: string;
  amount?: string;
  currency?: string;
  recipient?: string;
}

export const STEP_COLORS: Record<StepId, string> = {
  request: "text-step-request border-step-request",
  challenge: "text-step-challenge border-step-challenge",
  pay: "text-step-pay border-step-pay",
  retry: "text-step-retry border-step-retry",
  receipt: "text-step-receipt border-step-receipt",
};

export const STEP_BG_COLORS: Record<StepId, string> = {
  request: "bg-step-request/10",
  challenge: "bg-step-challenge/10",
  pay: "bg-step-pay/10",
  retry: "bg-step-retry/10",
  receipt: "bg-step-receipt/10",
};
