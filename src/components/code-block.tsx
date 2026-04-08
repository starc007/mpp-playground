"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = "bash", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-xs text-text-muted">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">{language}</span>
            <button
              onClick={handleCopy}
              className="text-xs text-text-muted hover:text-text transition-colors"
            >
              {copied ? "copied" : "copy"}
            </button>
          </div>
        </div>
      )}
      {!title && (
        <div className="flex justify-end px-4 py-2">
          <button
            onClick={handleCopy}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
      <pre className="px-4 py-3 overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
