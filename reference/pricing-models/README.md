# Reference pricing models

Pasted from `pcs.lib.pricing` — `PremiumCricket.Lib.Pricing/PricingModels`.

Organized to mirror the GitLab repo structure. Parsed metadata lives in `lib/pricing-models/registry.ts`.

## Pre-match / Matches

| File | Market code | Excel mapping status |
|------|-------------|---------------------|
| `MatchBetting.cs` | 2WMW | Prep Work C10:D11 mapped |
| `FirstDismissal.cs` | 01MOPD | Excel cells TBD |
| `PreMatch/Models/Matches/TiedMatch.cs` | 64PINB | PM Publication G22–G23 |
| `PreMatch/Models/Matches/TossWinDouble.cs` | TWD | PM Publication G26–G28 |
| `PreMatch/Models/Players/PlayerRuns.cs` | 5/6{n}BARU | Player - Runs (per player) |
| `PreMatch/Models/Matches/MatchTopBatter.cs` | PMTRSNL | Match Top Bat. |
| `PreMatch/Models/Matches/MatchTopBowler.cs` | PMTWTNL | Match Top Bowler. |
| `PreMatch/Models/HeadToHeads/TeamOfTopBat.cs` | 59BARUA | Team of Top Bat |
| `PreMatch/Models/HeadToHeads/TeamOfTopBowl.cs` | 510BARUA | Team of Top Bowl |
| `PreMatch/Models/Teams/TeamTopBatter.cs` | NL1/2TBNL | {Team} - Top Bat |
| `PreMatch/Models/Teams/TeamTopBowler.cs` | NL1/2BBNL | {Team} - Top Bowl |

## Base classes

| File | Extends | Used by |
|------|---------|---------|
| `HomeAwayMarketPricingModel.cs` | `MarketPricingModel<IPricingInputs>` | `TeamHomeAwayMarketPricingModel` |
| `PreMatch/Models/Teams/TeamHomeAwayMarketPricingModel.cs` | `HomeAwayMarketPricingModel` | `TeamTopBatter`, `TeamTopBowler` |
| `PreMatch/Models/Matches/MatchTopPlayer.cs` | `StandardMarketPricingModel` | `MatchTopBatter`, `MatchTopBowler` |
| `PreMatch/Models/HeadToHeads/MatchDerivativeMarket.cs` | `HeadStandardMarketPricingModel` | `TeamOfTopBat`, `TeamOfTopBowl` |
| `IMatchDerivativeMarket.cs` | — | `MatchDerivativeMarket` overload contract |

## Shared helpers

| File | Used by |
|------|---------|
| `PreMatch/Models/TopBatterMethods.cs` | MatchTopBatter, TeamTopBatter |

Paste additional models into the matching folder and tell Cursor to update the registry.
