# MPP Playground

A devtools-style playground for the [Machine Payments Protocol](https://mpp.dev) on [Tempo](https://tempo.xyz).

Inspect any MPP endpoint, pay with a passkey-based Tempo Wallet, customize payment pages, schedule transactions, and manage access keys — all in one place.

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

Visual theme customizer for mppx payment pages:

- 11 presets (Default, Dark, Tempo Green, Stripe, Purple, Rounded Dark, etc.)
- 8 color tokens with light/dark pickers
- 14 Google Font families + custom font URLs
- Layout controls: font size, border radius, spacing unit
- Text controls: page title, pay button, badge, expiry prefix
- Live preview iframe + copy-paste `tempo.charge({ html: {...} })` config
- Only emits values that differ from defaults

### Custom Script Builder (`/html/custom`)

GUI builder for fully custom payment UIs — replaces the built-in Tempo button with your own layout:

- 6 element types: Button, Text, Image, Container, Divider, Spacer
- 6 starter templates: Default Tempo, Minimal, Branded, Info Card, Multi-action, Blank
- Per-element properties + shared style controls (font size/weight, color, alignment, margins)
- Full page theme controls (same as HTML Builder)
- Generates real `Html.init('tempo')` scripts using `c.vars.*` for theme consistency
- Preview uses a mock `Html.init` shell so scripts run as they would in production

### TX Scheduler (`/scheduler`)

Schedule future Tempo token transfers:

- Set recipient, amount, token, broadcast time, optional expiry + memo
- Two-step flow: sign the tx with your wallet → pay $0.10 via MPP to schedule it
- Check status by schedule ID, view/cancel/delete scheduled transactions
- Backend cron worker broadcasts the tx when `validAfter` arrives

### Access Keys (`/access-keys`)

Create, view, and revoke TIP-1011 scoped spending keys for AI agents:

- Chain-enforced spending limits per token + expiry presets (1 / 7 / 30 / 90 days)
- Live usage bars — `used / total` pulled from the Account Keychain contract
- Color-coded progress: green < 70% · yellow < 90% · red otherwise
- Revoke with on-chain confirmation, then pruned from the local store
- Subscribes to the accounts SDK store so the list updates live

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
- Framer Motion for animations

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

HEHEHEHE
