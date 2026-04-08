"use client";

import type { Step, StepId } from "@/lib/types";
import { StepBadge, StepConnector } from "./step-badge";

interface StepFlowProps {
  steps: Step[];
  selectedStep: StepId | null;
  onSelectStep: (id: StepId) => void;
}

export function StepFlow({ steps, selectedStep, onSelectStep }: StepFlowProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-4 overflow-x-auto">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          {i > 0 && (
            <StepConnector isComplete={steps[i - 1].status === "complete"} />
          )}
          <StepBadge
            step={step}
            index={i}
            isSelected={selectedStep === step.id}
            onClick={() => {
              if (step.status === "complete" || step.status === "error") {
                onSelectStep(step.id);
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
