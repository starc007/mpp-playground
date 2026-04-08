"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/components/providers";
import type { HttpMethod } from "@/components/probe-input";
import type { Step, StepId, DetectionInfo, ChallengeData, Network } from "./types";

const INITIAL_STEPS: Step[] = [
  { id: "request", label: "Request", status: "idle" },
  { id: "challenge", label: "402 Challenge", status: "idle" },
  { id: "pay", label: "Pay", status: "idle" },
  { id: "retry", label: "Retry", status: "idle" },
  { id: "receipt", label: "Receipt", status: "idle" },
];

export function usePlayground() {
  const { address, isConnected } = useAccount();
  const { network, setNetwork, config } = useNetwork();
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [reqBody, setReqBody] = useState("");
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [selectedStep, setSelectedStep] = useState<StepId | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [detection, setDetection] = useState<DetectionInfo | null>(null);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [rawWwwAuthenticate, setRawWwwAuthenticate] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const updateStep = useCallback((id: StepId, update: Partial<Step>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...update } : s)),
    );
  }, []);

  const resetFlow = useCallback(() => {
    setSteps(INITIAL_STEPS);
    setSelectedStep(null);
    setDetection(null);
    setChallenge(null);
    setRawWwwAuthenticate(null);
    setError(null);
  }, []);

  const handleProbe = useCallback(async () => {
    if (!url) return;

    resetFlow();
    setIsProbing(true);
    setError(null);

    updateStep("request", {
      status: "active",
      data: {
        requestHeaders: {
          "User-Agent": "mpp-playground/1.0",
          Accept: "application/json",
        },
      },
    });

    try {
      const res = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method,
          ...(reqBody && method !== "GET" && method !== "DELETE"
            ? { body: reqBody }
            : {}),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Probe failed");
      }

      updateStep("request", {
        status: "complete",
        data: {
          requestHeaders: result.requestHeaders,
          responseHeaders: result.responseHeaders,
          statusCode: result.statusCode,
          body: result.body,
        },
      });

      if (result.mppEnabled && result.challenge) {
        setChallenge(result.challenge);
        setRawWwwAuthenticate(result.rawWwwAuthenticate ?? null);
        updateStep("challenge", {
          status: "complete",
          data: {
            responseHeaders: result.responseHeaders,
            statusCode: 402,
            body: result.challenge,
          },
        });

        setDetection({
          mppEnabled: true,
          method: result.challenge.method,
          intent: result.challenge.intent,
          amount: result.challenge.request?.amount as string,
          currency: result.challenge.request?.currency as string,
          recipient: result.challenge.request?.recipient as string,
        });

        setSelectedStep("challenge");
      } else {
        setDetection({ mppEnabled: false });
        setSelectedStep("request");
      }
    } catch (err) {
      updateStep("request", { status: "error" });
      setError(err instanceof Error ? err.message : "Probe failed");
    } finally {
      setIsProbing(false);
    }
  }, [url, method, reqBody, resetFlow, updateStep]);

  const handlePay = useCallback(async () => {
    if (!challenge || !isConnected || !address) return;

    setIsPaying(true);
    setError(null);
    updateStep("pay", { status: "active" });

    try {
      const { Mppx, tempo, session } = await import("mppx/client");
      const { getConnectorClient } = await import("wagmi/actions");

      const walletClient = await getConnectorClient(config);

      const isSession = challenge.intent === "session";

      const methods = isSession
        ? [
            session({
              getClient: () => walletClient,
              deposit: "1",
            }),
          ]
        : [
            tempo({
              getClient: () => walletClient,
              mode: "push",
            }),
          ];

      const mppx = Mppx.create({ methods, polyfill: false });

      const { Challenge: ChallengeModule } = await import("mppx");
      const wwwAuthHeader =
        rawWwwAuthenticate ?? ChallengeModule.serialize(challenge);

      const fakeResponse = new Response(null, {
        status: 402,
        headers: { "WWW-Authenticate": wwwAuthHeader },
      });

      const credential = await mppx.createCredential(fakeResponse);

      updateStep("pay", {
        status: "complete",
        data: {
          body: { credential: credential.slice(0, 50) + "..." },
        },
      });

      updateStep("retry", { status: "active" });

      const payRes = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          credential,
          method,
          ...(reqBody && method !== "GET" && method !== "DELETE"
            ? { body: reqBody }
            : {}),
        }),
      });

      const payResult = await payRes.json();

      updateStep("retry", {
        status: "complete",
        data: {
          requestHeaders: payResult.requestHeaders,
          responseHeaders: payResult.responseHeaders,
          statusCode: payResult.statusCode,
          body: payResult.body,
        },
      });

      updateStep("receipt", {
        status: "complete",
        data: {
          responseHeaders: payResult.responseHeaders,
          body: payResult.receipt ?? payResult.body,
          statusCode: payResult.statusCode,
        },
      });
      setSelectedStep("receipt");
    } catch (err) {
      updateStep("pay", { status: "error" });
      const msg = err instanceof Error ? err.message : "Payment failed";
      const short = msg.split("Request Arguments:")[0]?.trim() || msg;
      setError(short);
    } finally {
      setIsPaying(false);
    }
  }, [
    challenge,
    isConnected,
    address,
    url,
    method,
    reqBody,
    updateStep,
    rawWwwAuthenticate,
    config,
    network,
  ]);

  // Chain mismatch detection
  const challengeChainId = challenge?.request?.methodDetails
    ? (challenge.request.methodDetails as Record<string, unknown>)?.chainId
    : undefined;
  const expectedNetwork: Network | undefined =
    challengeChainId === 4217
      ? "mainnet"
      : challengeChainId === 42431
        ? "testnet"
        : undefined;
  const networkMismatch =
    expectedNetwork !== undefined && expectedNetwork !== network;

  const showPayButton =
    challenge &&
    isConnected &&
    !networkMismatch &&
    steps.find((s) => s.id === "challenge")?.status === "complete" &&
    steps.find((s) => s.id === "pay")?.status === "idle";

  return {
    // State
    url,
    setUrl,
    method,
    setMethod,
    reqBody,
    setReqBody,
    steps,
    selectedStep,
    setSelectedStep,
    isProbing,
    isPaying,
    detection,
    challenge,
    error,
    network,
    setNetwork,

    // Derived
    selectedStepData: steps.find((s) => s.id === selectedStep),
    showPayButton,
    networkMismatch,
    expectedNetwork,
    challengeChainId,

    // Actions
    handleProbe,
    handlePay,
  };
}
