"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { WalletBar } from "@/components/wallet-bar";
import { ProbeInput, type HttpMethod } from "@/components/probe-input";
import { StepBadge, StepConnector } from "@/components/step-badge";
import { Inspector } from "@/components/inspector";
import { DetectionBadge } from "@/components/detection-badge";
import { NetworkSelector } from "@/components/network-selector";
import { useNetwork } from "@/components/providers";
import type { Step, StepId, DetectionInfo, ChallengeData } from "@/lib/types";

const INITIAL_STEPS: Step[] = [
  { id: "request", label: "Request", status: "idle" },
  { id: "challenge", label: "402 Challenge", status: "idle" },
  { id: "pay", label: "Pay", status: "idle" },
  { id: "retry", label: "Retry", status: "idle" },
  { id: "receipt", label: "Receipt", status: "idle" },
];

export default function PlaygroundPage() {
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
      const { Mppx, tempo } = await import("mppx/client");
      const { getConnectorClient } = await import("wagmi/actions");

      const walletClient = await getConnectorClient(config);

      const mppx = Mppx.create({
        methods: [
          tempo({
            getClient: () => walletClient,
            mode: "push",
          }),
        ],
        polyfill: false,
      });

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

      // Step 4: Retry via server proxy
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
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsPaying(false);
    }
  }, [challenge, isConnected, address, url, method, reqBody, updateStep, rawWwwAuthenticate, config]);

  const selectedStepData = steps.find((s) => s.id === selectedStep);
  const showPayButton =
    challenge &&
    isConnected &&
    steps.find((s) => s.id === "challenge")?.status === "complete" &&
    steps.find((s) => s.id === "pay")?.status === "idle";

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <h1 className="text-sm font-semibold text-text tracking-wide uppercase">
            MPP Playground
          </h1>
          <NetworkSelector network={network} onChange={setNetwork} />
        </div>
        <WalletBar />
      </header>

      <main className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full space-y-8">
        <ProbeInput
          url={url}
          onUrlChange={setUrl}
          method={method}
          onMethodChange={setMethod}
          body={reqBody}
          onBodyChange={setReqBody}
          onProbe={handleProbe}
          isProbing={isProbing}
        />

        <div className="flex items-center justify-center gap-0 py-4 overflow-x-auto">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              {i > 0 && (
                <StepConnector
                  isComplete={steps[i - 1].status === "complete"}
                />
              )}
              <StepBadge
                step={step}
                index={i}
                isSelected={selectedStep === step.id}
                onClick={() => {
                  if (step.status === "complete" || step.status === "error") {
                    setSelectedStep(step.id);
                  }
                }}
              />
            </div>
          ))}
        </div>

        {showPayButton && (
          <div className="flex justify-center">
            <button
              onClick={handlePay}
              disabled={isPaying}
              className="px-8 py-3 rounded-lg bg-step-pay/20 text-step-pay text-sm font-medium hover:bg-step-pay/30 transition-colors disabled:opacity-50"
            >
              {isPaying ? "paying..." : "pay & complete flow"}
            </button>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
            {error}
          </div>
        )}

        {detection && <DetectionBadge info={detection} />}

        {selectedStep && selectedStepData?.data && (
          <Inspector stepId={selectedStep} data={selectedStepData.data} />
        )}
      </main>

      <footer className="px-6 py-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>
            built on{" "}
            <a
              href="https://mpp.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-accent transition-colors"
            >
              mpp.dev
            </a>
          </span>
          <span>
            powered by{" "}
            <a
              href="https://tempo.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-accent transition-colors"
            >
              Tempo
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
