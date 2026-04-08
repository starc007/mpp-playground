"use client";

import { STEP_BG_COLORS, STEP_COLORS, type Step } from "@/lib/types";

interface StepBadgeProps {
  step: Step;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function StepBadge({ step, index, isSelected, onClick }: StepBadgeProps) {
  const isClickable = step.status === "complete" || step.status === "error";
  const colorClass = STEP_COLORS[step.id];
  const bgClass = STEP_BG_COLORS[step.id];

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all
        ${isSelected ? `${colorClass} ${bgClass} border-current` : "border-border text-text-muted"}
        ${isClickable ? "cursor-pointer hover:border-border-active" : "cursor-default"}
        ${step.status === "active" ? "animate-pulse" : ""}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-dim">{index + 1}</span>
        <span className={`text-sm font-medium ${step.status === "complete" ? colorClass : ""}`}>
          {step.label}
        </span>
      </div>

      {step.status === "complete" && (
        <div className={`w-1.5 h-1.5 rounded-full bg-current ${colorClass}`} />
      )}
      {step.status === "active" && (
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
      )}
      {step.status === "error" && (
        <div className="w-1.5 h-1.5 rounded-full bg-error" />
      )}
    </button>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

export function StepConnector({ isComplete }: StepConnectorProps) {
  return (
    <div className="flex items-center">
      <div
        className={`w-8 h-px ${isComplete ? "bg-accent" : "bg-border"} transition-colors`}
      />
      <svg className={`w-2 h-2 -ml-1 ${isComplete ? "text-accent" : "text-border"}`} viewBox="0 0 8 8">
        <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
