"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  url: string | null;
  /**
   * Label shown on the button. Defaults to `"share"` for the inspector
   * page; pass `"copy"` from the payment-links page.
   */
  label?: string;
}

export function ShareButton({ url, label = "share" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      title={`Copy ${label === "share" ? "shareable playground link" : "payment link"}`}
    >
      {copied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "copied" : label}
    </Button>
  );
}
