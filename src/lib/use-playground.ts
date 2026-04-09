"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/components/providers";
import type { HttpMethod } from "@/components/probe-input";
import type {
  Step,
  StepId,
  DetectionInfo,
  ChallengeData,
  Network,
} from "./types";
import { networkForChainId, WEBAUTHN_GAS_BUFFER } from "./chains";
import { probeEndpoint, payEndpoint } from "./api";

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
  const autoProbeRef = useRef(false);

  // Hydrate from query params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    const methodParam = params.get("method") as HttpMethod | null;
    const bodyParam = params.get("body");
    const networkParam = params.get("network") as Network | null;

    if (urlParam) setUrl(urlParam);
    if (methodParam) setMethod(methodParam);
    if (bodyParam) setReqBody(bodyParam);
    if (networkParam === "mainnet" || networkParam === "testnet") {
      setNetwork(networkParam);
    }

    // Mark for auto-probe after state settles
    if (urlParam) autoProbeRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state → URL (without triggering navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (url) params.set("url", url);
    if (method !== "GET") params.set("method", method);
    if (reqBody) params.set("body", reqBody);
    if (network !== "testnet") params.set("network", network);

    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [url, method, reqBody, network]);

  const shareableUrl = (() => {
    if (typeof window === "undefined" || !url) return null;
    const params = new URLSearchParams();
    params.set("url", url);
    if (method !== "GET") params.set("method", method);
    if (reqBody) params.set("body", reqBody);
    if (network !== "testnet") params.set("network", network);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  })();

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
      const result = await probeEndpoint({ url, method, body: reqBody });

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

  // Auto-probe after URL is hydrated from query params
  useEffect(() => {
    if (autoProbeRef.current && url) {
      autoProbeRef.current = false;
      handleProbe();
    }
  }, [url, handleProbe]);

  const handlePay = useCallback(async () => {
    if (!challenge || !isConnected || !address) return;

    setIsPaying(true);
    setError(null);
    updateStep("pay", { status: "active" });

    try {
      const { Mppx, tempo, session } = await import("mppx/client");
      const { getConnectorClient } = await import("wagmi/actions");

      const isSession = challenge.intent === "session";

      // Wrap the connector client to bump gas estimates. WebAuthn wallets
      // + fee-payer dual signatures need ~25k more gas than the node
      // estimates. Without this, transferWithMemo reverts out-of-gas.
      const GAS_BUFFER = WEBAUTHN_GAS_BUFFER;
      const getClient = async () => {
        const client = await getConnectorClient(config);
        const originalRequest = client.request.bind(client);
        return Object.assign(Object.create(client), {
          ...client,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          request: async (args: any, opts?: any): Promise<any> => {
            const result = await originalRequest(args, opts);
            if (
              args.method === "eth_fillTransaction" &&
              result &&
              typeof result === "object" &&
              "gas" in result
            ) {
              const bumped = BigInt(result.gas as string) + GAS_BUFFER;
              return { ...result, gas: "0x" + bumped.toString(16) };
            }
            return result;
          },
        });
      };

      const methods = isSession
        ? [session({ getClient, deposit: "1" })]
        : [tempo({ mode: "push", getClient })];

      const mppx = Mppx.create({ methods, polyfill: false });

      // Reconstruct a 402 response with the original WWW-Authenticate
      // header so mppx can parse the challenge and create a credential.
      const fakeResponse = new Response(null, {
        status: 402,
        headers: { "WWW-Authenticate": rawWwwAuthenticate! },
      });

      const credential = await mppx.createCredential(fakeResponse);

      updateStep("pay", {
        status: "complete",
        data: { body: { credential: credential.slice(0, 50) + "..." } },
      });

      updateStep("retry", { status: "active" });

      const payResult = await payEndpoint({
        url,
        credential,
        method,
        body: reqBody,
      });

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
  ]);

  // Chain mismatch detection — compare the challenge's requested chain with
  // the playground's currently selected network.
  const challengeChainId = (() => {
    const details = challenge?.request?.methodDetails as
      | Record<string, unknown>
      | undefined;
    const id = details?.chainId;
    return typeof id === "number" ? id : undefined;
  })();
  const expectedNetwork: Network | undefined =
    challengeChainId !== undefined
      ? networkForChainId(challengeChainId)
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
    shareableUrl,
    handleProbe,
    handlePay,
  };
}
