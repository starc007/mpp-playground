"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface PaymentLinkPreviewProps {
  url: string;
  method: string;
}

export function PaymentLinkPreview({ url, method }: PaymentLinkPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Payment links only render HTML for GET (browser navigation).
  if (method !== "GET") {
    return (
      <Card className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Payment link preview is only available for GET endpoints.
        </p>
        <p className="text-xs text-text-dim mt-1">
          ({method} requests don&apos;t render HTML payment pages)
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Payment Link Preview
          </span>
          <span className="text-[10px] text-text-dim">
            (rendered when html: true)
          </span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          open in new tab ↗
        </a>
      </div>

      <div className="relative bg-white h-150">
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-text-dim text-xs">
            loading preview…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs bg-card">
            <p>Cannot embed this page (X-Frame-Options blocks iframe).</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
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
    </Card>
  );
}
