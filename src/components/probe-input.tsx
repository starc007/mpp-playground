"use client";

import { useState } from "react";
import { EXAMPLE_ENDPOINTS } from "@/lib/examples";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

interface ProbeInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  method: HttpMethod;
  onMethodChange: (method: HttpMethod) => void;
  body: string;
  onBodyChange: (body: string) => void;
  onProbe: () => void;
  isProbing: boolean;
}

export function ProbeInput({
  url,
  onUrlChange,
  method,
  onMethodChange,
  body,
  onBodyChange,
  onProbe,
  isProbing,
}: ProbeInputProps) {
  const [showBody, setShowBody] = useState(false);
  const hasBody = method !== "GET" && method !== "DELETE";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          className="appearance-none px-3 py-3 rounded-lg border border-border bg-bg-card text-sm text-accent font-medium cursor-pointer focus:outline-none focus:border-accent/50 transition-colors"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

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

      {hasBody && (
        <div>
          <button
            onClick={() => setShowBody(!showBody)}
            className="text-xs text-text-muted hover:text-accent transition-colors mb-2"
          >
            {showBody ? "- hide body" : "+ add request body"}
          </button>
          {showBody && (
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder='{"prompt": "hello"}'
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors resize-y"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs text-text-dim">try:</span>
        <div className="flex gap-2">
          {EXAMPLE_ENDPOINTS.map((ex) => (
            <button
              key={ex.url}
              onClick={() => {
                onUrlChange(ex.url);
                if (ex.method) onMethodChange(ex.method);
              }}
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
