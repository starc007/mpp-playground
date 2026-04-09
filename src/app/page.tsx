"use client";

import { usePlayground } from "@/lib/use-playground";
import { ProbeInput } from "@/components/probe-input";
import { StepFlow } from "@/components/step-flow";
import { Inspector } from "@/components/inspector";
import { DetectionBadge } from "@/components/detection-badge";
import { ShareButton } from "@/components/share-button";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";

export default function PlaygroundPage() {
  const pg = usePlayground();

  const showNetworkWarning =
    pg.networkMismatch &&
    pg.challenge &&
    pg.steps.find((s) => s.id === "challenge")?.status === "complete";

  return (
    <DashboardLayout
      title="MPP Inspector"
      description="Probe any MPP endpoint and watch the full 402 flow animate — request, challenge, pay, retry, receipt."
    >
      <ProbeInput
        url={pg.url}
        onUrlChange={pg.setUrl}
        method={pg.method}
        onMethodChange={pg.setMethod}
        body={pg.reqBody}
        onBodyChange={pg.setReqBody}
        onProbe={pg.handleProbe}
        isProbing={pg.isProbing}
      />

      {pg.url && (
        <div className="flex justify-end -mt-4">
          <ShareButton url={pg.shareableUrl} />
        </div>
      )}

      <StepFlow
        steps={pg.steps}
        selectedStep={pg.selectedStep}
        onSelectStep={pg.setSelectedStep}
      />

      {showNetworkWarning && (
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-3 rounded-lg border border-step-challenge/30 bg-step-challenge/5 text-step-challenge text-sm text-center">
            This service requires{" "}
            <span className="font-medium">{pg.expectedNetwork}</span> (chain{" "}
            {String(pg.challengeChainId)}). Switch network to pay.
          </div>
          <Button
            variant="link"
            size="xs"
            onClick={() => pg.setNetwork(pg.expectedNetwork!)}
          >
            switch to {pg.expectedNetwork}
          </Button>
        </div>
      )}

      {pg.showPayButton && (
        <div className="flex justify-center">
          <Button
            onClick={pg.handlePay}
            disabled={pg.isPaying}
            size="lg"
            className="h-11 px-8 bg-step-pay/20 text-step-pay hover:bg-step-pay/30"
          >
            {pg.isPaying ? "paying…" : "pay & complete flow"}
          </Button>
        </div>
      )}

      {pg.error && (
        <div className="px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm max-h-32 overflow-auto break-all whitespace-pre-wrap">
          {pg.error}
        </div>
      )}

      {pg.detection && <DetectionBadge info={pg.detection} />}

      {pg.selectedStep && pg.selectedStepData?.data && (
        <Inspector stepId={pg.selectedStep} data={pg.selectedStepData.data} />
      )}
    </DashboardLayout>
  );
}
