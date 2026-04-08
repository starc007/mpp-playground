# MPP Playground

A devtools-style playground for the [Machine Payments Protocol](https://mpp.dev) on [Tempo](https://tempo.xyz).

Inspect any MPP endpoint, pay with a passkey-based Tempo Wallet, and generate hosted payment links — all in one place.

## Why

Tempo's docs are interactive, but a friend asked if there was a way to actually see the full flow and headers end-to-end. So I built this.

## Features

### MPP Inspector (`/`)

Probe any MPP-enabled endpoint and watch the full 402 flow animate:

- **Request → Challenge → Pay → Retry → Receipt** — every step inspectable
- Decoded `WWW-Authenticate` challenge with method, intent, amount, recipient
- Decoded `Payment-Receipt` after payment
- Method selector (GET / POST / PUT / DELETE / PATCH) + request body editor
- Network mismatch detection (testnet ↔ mainnet)
- Shareable URLs — `?url=...&method=POST` pre-fills and auto-probes
- Supports both `charge` and `session` intents

### Payment Link Generator (`/payment-links`)

Create hosted, shareable payment links without writing a server:

- Form-based config: amount, currency, recipient, description, network
- Backed by `mppx/server` running inside a Next.js API route
- Anyone with the link can pay — no account required
- Live iframe preview of the rendered Tempo payment page

### HTML Builder (`/html`)

Visual customizer for the payment page UI. _(Coming soon.)_

## Wallet

Uses Tempo's [Accounts SDK](https://docs.tempo.xyz/accounts) for passkey-based wallet auth — no seed phrases, no extensions.

```ts
import { tempoWallet } from "accounts/wagmi";

createConfig({
  chains: [tempoModerato],
  connectors: [tempoWallet({ testnet: true })],
});
```

Network can be switched between testnet (Moderato) and mainnet from the header.

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [mppx](https://github.com/wevm/mppx) — Machine Payments Protocol SDK
- [accounts](https://github.com/tempoxyz/accounts) — Tempo Accounts SDK
- [wagmi](https://wagmi.sh) + [viem](https://viem.sh)
- Tailwind CSS v4

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Optional — only needed for the Payment Link Generator in production:

```bash
MPP_SECRET_KEY=your-secret-key   # HMAC secret for signing challenge IDs
```

## License

MIT
