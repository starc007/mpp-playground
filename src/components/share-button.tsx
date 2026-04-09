"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  url: string | null;
}

export function ShareButton({ url }: ShareButtonProps) {
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
      size="xs"
      onClick={handleCopy}
      title="Copy shareable playground link"
    >
      <svg
        className="size-3"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 8a3 3 0 0 1 3-3h2M11 8a3 3 0 0 1-3 3H6" />
        <path d="M6 8h4" />
      </svg>
      {copied ? "copied" : "share"}
    </Button>
  );
}
