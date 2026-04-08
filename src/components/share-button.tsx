"use client";

import { useState } from "react";

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
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
      title="Copy shareable playground link"
    >
      <svg
        className="w-3 h-3"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 8a3 3 0 0 1 3-3h2M11 8a3 3 0 0 1-3 3H6" />
        <path d="M6 8h4" />
      </svg>
      {copied ? "copied" : "share"}
    </button>
  );
}
