"use client";

import { CodeBlock } from "./code-block";

interface CurlPanelProps {
  url: string;
}

export function CurlPanel({ url }: CurlPanelProps) {
  const commands = [
    {
      title: "Inspect (probe without paying)",
      code: `npx mppx ${url} --dry-run`,
    },
    {
      title: "Pay and get resource",
      code: `npx mppx ${url}`,
    },
    {
      title: "Verbose (show headers)",
      code: `npx mppx ${url} -vv`,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text">CLI Commands</h3>
      <div className="space-y-2">
        {commands.map((cmd) => (
          <CodeBlock key={cmd.title} code={cmd.code} title={cmd.title} language="bash" />
        ))}
      </div>
    </div>
  );
}
