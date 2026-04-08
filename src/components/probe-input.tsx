"use client";

import { EXAMPLE_ENDPOINTS } from "@/lib/examples";

interface ProbeInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onProbe: () => void;
  isProbing: boolean;
}

export function ProbeInput({
  url,
  onUrlChange,
  onProbe,
  isProbing,
}: ProbeInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm">
            $
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onProbe()}
            placeholder="https://mpp.dev/api/ping/paid"
            className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <button
          onClick={onProbe}
          disabled={isProbing || !url}
          className="px-6 py-3 rounded-lg bg-accent text-bg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProbing ? "probing..." : "probe"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-text-dim">try:</span>
        <div className="flex gap-2">
          {EXAMPLE_ENDPOINTS.map((ex) => (
            <button
              key={ex.url}
              onClick={() => onUrlChange(ex.url)}
              className="text-xs px-2.5 py-1 rounded border border-border text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
