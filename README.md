# Model Manager

Registry and parity tooling for cricket betting outcome models migrating from Excel to AWS Lambda.

## Problem this solves

Excel workbooks hide variables inside nested formulas and VBA. Lambda functions embed constants in code. Traders need a clear view of:

- **Embedded** — baked into the function, not exposed
- **Parameter** — supplied at runtime (venue data, match state) but not trader-controlled
- **Trading input** — must exist in the trading interface

This app tracks which variables exist in Excel vs Lambda, flags parity gaps, and compares outputs for the same fixture.

## Local development

```bash
npm install
cp .env.example .env.local
# add Clerk keys from https://dashboard.clerk.com
npm run dev
```

Use the Sportradar artifact mirror **locally** (user npm config or a gitignored `.npmrc`):

```bash
npm config set registry https://cdproxy.sportradar.online/npm/
```

Do **not** commit that registry into the repo — Vercel cannot reach `cdproxy` and `npm install` will fail on deploy. See [Artifact mirror](https://blog.engineering.sportradar.online/artifact-mirror-3/) and [cdproxy install](https://cdproxy.sportradar.online/install).

Vercel uses Node **20.x** (`package.json` engines / `.nvmrc`) and the public npm registry.

### Auth (Clerk)

The app is gated behind [Clerk](https://clerk.com). Unsigned users are redirected to `/sign-in`. Access further requires an email on the allowlisted domain (`ALLOWED_EMAIL_DOMAIN`, default `sportradar.com`).

1. Create a Clerk application and copy **Publishable** + **Secret** keys into `.env.local` (and Vercel env vars).
2. In Clerk Dashboard → **Configure → Restrictions**, enable **Allowlist** and add `*@sportradar.com` (defense in depth alongside the app check).
3. Set allowed origins to your Vercel URL and `http://localhost:3010`.
4. Optional: disable public sign-up and invite users manually if you want a tighter roster.

See `.env.example` for all variables.

### Scorecard data (ODI / T20 analysis)

`matches.json` files are generated locally and not committed (they exceed GitHub size limits). After cloning, run:

```bash
python scripts/extract-odi-scorecards.py
python scripts/extract-t20-scorecards.py
```

Source workbooks must be available at the paths configured in those scripts. Outputs write to `lib/*/matches.json` (gitignored). The app bundles empty fallbacks for production builds; locally, data is loaded at runtime from `matches.json` via `/api/scorecards/[format]`.

## Deploy to Vercel

Import [bcarson645/Model-manager](https://github.com/bcarson645/Model-manager) at [vercel.com/new](https://vercel.com/new). Next.js is auto-detected.

Add the same Clerk / `ALLOWED_EMAIL_DOMAIN` env vars in the Vercel project. After deploy, add the production URL under Clerk → **Domains**.

Do **not** rely on a public unauthenticated deployment — Model Manager contains product-sensitive pricing model detail.

## Architecture (planned integrations)

| Source | Integration approach |
|--------|---------------------|
| Excel | Parse named ranges / input sheets; invoke via COM automation or exported JSON snapshots |
| Lambda | Inventory handler event schemas; invoke with shared input payloads; diff response bodies |
| Trading UI | Export `trading_input` variables as the contract for what the interface must expose |

## API

- `GET /api/models` — model registry
- `GET /api/variables?scope=trading_input&issues=true` — variable inventory
- `GET /api/compare` — fixture output comparisons

## Project structure

- `lib/types.ts` — domain types
- `lib/sample-data.ts` — cricket betting sample models (replace with real data)
- `components/Dashboard.tsx` — tabbed UI
- `components/VariableMatrix.tsx` — Excel vs Lambda variable tracking
- `components/OutputComparison.tsx` — side-by-side output diff
