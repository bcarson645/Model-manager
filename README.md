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
npm run dev
```

### Scorecard data (ODI / T20 analysis)

`matches.json` files are generated locally and not committed (they exceed GitHub size limits). After cloning, run:

```bash
python scripts/extract-odi-scorecards.py
python scripts/extract-t20-scorecards.py
```

Source workbooks must be available at the paths configured in those scripts. Outputs write to `lib/*/matches.json` (gitignored). The app bundles empty fallbacks for production builds; locally, data is loaded at runtime from `matches.json` via `/api/scorecards/[format]`.

## Deploy to Vercel

Import [bcarson645/Model-manager](https://github.com/bcarson645/Model-manager) at [vercel.com/new](https://vercel.com/new). Next.js is auto-detected.

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
