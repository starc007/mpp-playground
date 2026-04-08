"use client";

import { EXAMPLE_ENDPOINTS } from "@/lib/examples";

interface ProbeInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onProbe: () => void;
  isProbing: boolean;
}

export function ProbeInput({ url, onUrlChange, onProbe, isProbing }: ProbeInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onProbe()}
          placeholder="https://mpp.dev/api/ping/paid"
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={onProbe}
          disabled={isProbing || !url}
          className="px-6 py-2.5 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProbing ? "probing..." : "probe"}
        </button>
      </div>

      <div className="flex gap-2">
        <span className="text-xs text-text-dim">try:</span>
        {EXAMPLE_ENDPOINTS.map((ex) => (
          <button
            key={ex.url}
            onClick={() => onUrlChange(ex.url)}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            {ex.label} <span className="text-text-dim">({ex.description})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
