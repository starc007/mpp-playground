# Contributing

Thanks for your interest in contributing to the MPP Playground!

This project is a devtools-style playground for the [Machine Payments Protocol](https://mpp.dev) on [Tempo](https://tempo.xyz). It's meant to help developers inspect MPP endpoints, generate payment links, and prototype custom payment UIs — so contributions that improve the developer experience are especially welcome.

## Ways to contribute

- **Bug reports** — if something doesn't work, open an issue with a reproduction (URL, method, network, what you expected, what happened).
- **Feature ideas** — open an issue to discuss before building anything non-trivial.
- **Pull requests** — see below.

## Development setup

```bash
git clone https://github.com/starc007/mpp-playground.git
cd mpp-playground
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Project layout

```
src/
  app/              Next.js App Router pages + API routes
    api/probe       Server-side probe proxy (avoids CORS)
    api/pay         Server-side retry with credential
    api/payment-link/[id]   Hosted payment link endpoint (mppx/server)
  components/
    ui/             shadcn primitives (Button, Input, Select, …)
    ...             Playground-specific components
  lib/
    api.ts          Typed client for /api/probe and /api/pay
    chains.ts       Tempo chain ID constants
    currencies.ts   TIP-20 token list
    use-playground.ts   Main state + logic hook
    wagmi.ts        Wagmi config factory (testnet / mainnet)
```

## Pull request checklist

Before opening a PR, run:

```bash
npm run lint        # ESLint
npx tsc --noEmit    # Type check
npm run build       # Production build
```

All three must pass. The CI workflow (`.github/workflows/ci.yml`) runs the same checks on every PR.

### Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org):

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change that isn't a feature or fix
- `chore:` tooling, build, dependencies
- `docs:` documentation only

Keep commits focused and readable in `git log`.

### Code style

- Prefer shadcn primitives (`@/components/ui/*`) for new UI.
- Use semantic tokens (`text-primary`, `bg-card`, `border-border`) over hard-coded colors.
- Keep files small and focused. If a component grows past ~150 lines, split it.
- No `any` — `unknown` is fine if you're at a boundary.
- Don't add dependencies without a reason.

## Questions?

Open an issue or a discussion — happy to chat.
