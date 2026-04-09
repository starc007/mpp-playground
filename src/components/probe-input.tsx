"use client";

import { useState } from "react";
import { EXAMPLE_ENDPOINTS } from "@/lib/examples";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Select
          value={method}
          onValueChange={(v) => v && onMethodChange(v as HttpMethod)}
        >
          <SelectTrigger className="h-12 w-25 font-medium text-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm pointer-events-none">
            $
          </span>
          <Input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onProbe()}
            placeholder="https://mpp.dev/api/ping/paid"
            className="h-12 pl-8 pr-4 text-sm font-mono"
          />
        </div>

        <Button
          onClick={onProbe}
          disabled={isProbing || !url}
          size="lg"
          className="h-12 px-6"
        >
          {isProbing ? "probing..." : "probe"}
        </Button>
      </div>

      {hasBody && (
        <div>
          <button
            onClick={() => setShowBody(!showBody)}
            className="text-xs text-text-muted hover:text-primary transition-colors mb-2"
          >
            {showBody ? "− hide body" : "+ add request body"}
          </button>
          {showBody && (
            <Textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder='{"prompt": "hello"}'
              rows={4}
              className="font-mono text-sm"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs text-text-dim">try:</span>
        <div className="flex gap-2 flex-wrap">
          {EXAMPLE_ENDPOINTS.map((ex) => (
            <Button
              key={ex.url}
              variant="outline"
              size="xs"
              onClick={() => {
                onUrlChange(ex.url);
                if (ex.method) onMethodChange(ex.method);
              }}
            >
              {ex.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
