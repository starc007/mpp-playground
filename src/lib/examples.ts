import type { HttpMethod } from "@/components/probe-input";

export const EXAMPLE_ENDPOINTS = [
  {
    label: "Ping",
    url: "https://mpp.dev/api/ping/paid",
    description: "Tempo · charge",
    method: "GET" as HttpMethod,
  },
  {
    label: "Parallel",
    url: "https://parallelmpp.dev",
    description: "Search",
    method: "POST" as HttpMethod,
  },
  {
    label: "OpenAI",
    url: "https://openai.mpp.tempo.xyz/v1/chat/completions",
    description: "AI",
    method: "POST" as HttpMethod,
  },
  {
    label: "Anthropic",
    url: "https://anthropic.mpp.tempo.xyz/v1/messages",
    description: "AI",
    method: "POST" as HttpMethod,
  },
] as const;
