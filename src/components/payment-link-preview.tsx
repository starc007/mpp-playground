"use client";

import { useState } from "react";

interface PaymentLinkPreviewProps {
  url: string;
  method: string;
}

export function PaymentLinkPreview({ url, method }: PaymentLinkPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Payment links only work for GET requests (browser navigation)
  if (method !== "GET") {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-6 text-center">
        <p className="text-xs text-text-muted">
          Payment link preview is only available for GET endpoints.
        </p>
        <p className="text-xs text-text-dim mt-1">
          ({method} requests don&apos;t render HTML payment pages)
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Payment Link Preview</span>
          <span className="text-[10px] text-text-dim">
            (rendered when html: true)
          </span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          open in new tab ↗
        </a>
      </div>

      <div className="relative bg-white" style={{ height: "600px" }}>
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-text-dim text-xs">
            loading preview...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted text-xs bg-bg-surface">
            <p>Cannot embed this page (X-Frame-Options blocks iframe).</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Open payment link in new tab ↗
            </a>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Payment link preview"
        />
      </div>
    </div>
  );
}
