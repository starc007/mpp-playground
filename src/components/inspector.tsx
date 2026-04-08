"use client";

import { useState } from "react";
import type { StepData, StepId } from "@/lib/types";
import { STEP_COLORS } from "@/lib/types";

interface InspectorProps {
  stepId: StepId;
  data: StepData;
}

type Tab = "headers" | "body";

export function Inspector({ stepId, data }: InspectorProps) {
  const [tab, setTab] = useState<Tab>("headers");
  const colorClass = STEP_COLORS[stepId];

  return (
    <div className="rounded-lg border border-border bg-bg-card overflow-hidden">
      <div className="flex items-center border-b border-border">
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
        {data.statusCode && (
          <div className="ml-auto px-4">
            <span className={`text-xs font-medium ${colorClass}`}>
              {data.statusCode}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 overflow-auto max-h-96">
        {tab === "headers" && (
          <div className="space-y-4">
            {data.requestHeaders && Object.keys(data.requestHeaders).length > 0 && (
              <div>
                <h4 className="text-xs text-text-muted mb-2 uppercase tracking-wider">
                  Request Headers
                </h4>
                <HeaderList headers={data.requestHeaders} />
              </div>
            )}
            {data.responseHeaders && Object.keys(data.responseHeaders).length > 0 && (
              <div>
                <h4 className="text-xs text-text-muted mb-2 uppercase tracking-wider">
                  Response Headers
                </h4>
                <HeaderList headers={data.responseHeaders} />
              </div>
            )}
          </div>
        )}
        {tab === "body" && (
          <pre className="text-sm leading-relaxed whitespace-pre-wrap break-all">
            {data.body ? JSON.stringify(data.body, null, 2) : "No body"}
          </pre>
        )}
      </div>
    </div>
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
      className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
        active
          ? "text-text border-accent"
          : "text-text-muted border-transparent hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

function HeaderList({ headers }: { headers: Record<string, string> }) {
  return (
    <div className="space-y-1">
      {Object.entries(headers).map(([key, value]) => (
        <div key={key} className="flex gap-2 text-sm">
          <span className="text-accent shrink-0">{key}:</span>
          <span className="text-text-muted break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}
