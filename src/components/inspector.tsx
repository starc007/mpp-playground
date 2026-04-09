"use client";

import { useState } from "react";
import type { StepData, StepId } from "@/lib/types";
import { STEP_COLORS } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InspectorProps {
  stepId: StepId;
  data: StepData;
}

type Tab = "headers" | "body";

export function Inspector({ stepId, data }: InspectorProps) {
  const [tab, setTab] = useState<Tab>("headers");
  const colorClass = STEP_COLORS[stepId];

  return (
    <Card className="overflow-hidden p-0 gap-0">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-2">
        <TabButton
          label="Headers"
          active={tab === "headers"}
          onClick={() => setTab("headers")}
        />
        <TabButton
          label="Body"
          active={tab === "body"}
          onClick={() => setTab("body")}
        />
        {data.statusCode !== undefined && (
          <div className="ml-auto px-3">
            <span className={`text-xs font-medium ${colorClass}`}>
              {data.statusCode}
            </span>
          </div>
        )}
      </div>

      {/* Panel */}
      <div className="p-4 overflow-auto max-h-96">
        {tab === "headers" && (
          <div className="space-y-4">
            {data.requestHeaders &&
              Object.keys(data.requestHeaders).length > 0 && (
                <HeaderSection
                  title="Request Headers"
                  headers={data.requestHeaders}
                />
              )}
            {data.responseHeaders &&
              Object.keys(data.responseHeaders).length > 0 && (
                <HeaderSection
                  title="Response Headers"
                  headers={data.responseHeaders}
                />
              )}
          </div>
        )}
        {tab === "body" && (
          <pre className="text-sm leading-relaxed whitespace-pre-wrap break-all font-mono">
            {data.body ? JSON.stringify(data.body, null, 2) : "No body"}
          </pre>
        )}
      </div>
    </Card>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
        active
          ? "text-foreground border-primary"
          : "text-muted-foreground border-transparent hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function HeaderSection({
  title,
  headers,
}: {
  title: string;
  headers: Record<string, string>;
}) {
  return (
    <div>
      <h4 className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-1 font-mono">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-sm">
            <span className="text-primary shrink-0">{key}:</span>
            <span className="text-muted-foreground break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
