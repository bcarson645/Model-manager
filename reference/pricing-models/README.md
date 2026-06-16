# Reference pricing models

Pasted from `pcs.lib.pricing` — `PremiumCricket.Lib.Pricing/PricingModels`.

Organized to mirror the GitLab repo structure. Parsed metadata lives in `lib/pricing-models/registry.ts`.

## Pre-match / Matches

| File | Market code | Excel mapping status |
|------|-------------|---------------------|
| `MatchBetting.cs` | 2WMW | Prep Work C10:D11 mapped |
| `FirstDismissal.cs` | 01MOPD | PM Publication G45:G51 |
| `FirstPartnership.cs` | 01FONW | PM Publication row 44 |
| `PreMatch/Models/Matches/MatchFours.cs` | 51BARUA | Match Fours (row 52) |
| `PreMatch/Models/Matches/MatchSixes.cs` | 52BARUA | Match Sixes (row 53) |
| `PreMatch/Models/Matches/MatchRunOuts.cs` | 53BARUA | Match Run Outs (row 54) |
| `PreMatch/Models/Matches/MatchMaxOver.cs` | 54BARUA | Max Runs in an Over (row 55) |
| `PreMatch/Models/Matches/MatchDucks.cs` | 55BARUA | Match Ducks (row 56) |
| `PreMatch/Models/Matches/MatchWides.cs` | 56BARUA | Match Wides (row 57) |
| `PreMatch/Models/Matches/MatchExtras.cs` | 57BARUA | Match Extras (row 58) |
| `PreMatch/Models/Matches/MatchWickets.cs` | 58BARUA | Match Wickets (row 59) |
| `PreMatch/Models/Matches/TossWinner.cs` | 54PINB | Toss Winner (rows 24–25) |
| `PreMatch/Models/Matches/RabbitRuns.cs` | 64BARUA | Rabbit Runs (row 76) |
| `PreMatch/Models/Matches/MilestoneMarketModel.cs` | — | Base for milestone yes/no markets |
| `PreMatch/Models/Matches/MilestoneMarkets.cs` | 61BARUA / HUNDIN / 62BARUA | Fifty/Hundred innings & match |
| `PreMatch/Models/Matches/TiedMatch.cs` | 64PINB | PM Publication G22–G23 |
| `PreMatch/Models/Matches/TossWinDouble.cs` | TWD | PM Publication G26–G28 |
| `PreMatch/Models/Players/PlayerRuns.cs` | 5/6{n}BARU | Player - Runs (rows 257–266) |
| `PreMatch/Models/Players/PlayerFours.cs` | 5/6{n}BA4U | Player - Fours (rows 267–276) |
| `PreMatch/Models/Players/PlayerSixes.cs` | 5/6{n}BA6U | Player - Sixes (rows 277–286) |
| `PreMatch/Models/Players/PlayerBallsFaced.cs` | 5/6{n}BABF | Player - Balls Faced (rows 610–619) |
| `PreMatch/Models/Players/PlayerPerformance.cs` | 56BARU / PERF{n} | Player - Player Perf (rows 337–346) |
| `PreMatch/Models/Matches/MatchTopBatter.cs` | PMTRSNL | Match Top Bat. |
| `PreMatch/Models/Matches/MatchTopBowler.cs` | PMTWTNL | Match Top Bowler. |
| `PreMatch/Models/Matches/HighestIndividualScore.cs` | 63BARUA | Highest Individual Score (row 75) |
| `PreMatch/Models/HeadToHeads/TeamOfTopBat.cs` | 59BARUA | Team of Top Bat |
| `PreMatch/Models/HeadToHeads/TeamOfTopBowl.cs` | 510BARUA | Team of Top Bowl |
| `PreMatch/Models/HeadToHeads/FirstInningsLead.cs` | FRSTIL | First Innings Lead (rows 64–66) |
| `PreMatch/Models/HeadToHeads/HighestOpeningPartnership.cs` | HOPA | Highest Opening Partnership (rows 92–94) |
| `PreMatch/Models/HeadToHeads/MostWickets.cs` | BWLVBWL | To Take Most Wickets (rows 544–546) |
| `PreMatch/Models/Teams/TeamTopBatter.cs` | NL1/2TBNL | {Team} - Top Bat |
| `PreMatch/Models/Teams/TeamTopBowler.cs` | NL1/2BBNL | {Team} - Top Bowl |
| `PreMatch/Models/Teams/TeamFours.cs` | 54PIN / 64PIN | {Team} Fours (3 lines) |
| `PreMatch/Models/Teams/TeamSixes.cs` | 56PIN / 66PIN | {Team} Sixes (3 lines) |
| `PreMatch/Models/Teams/TeamWickets.cs` | 5WILO / 6WILO | {Team} Wickets Lost |
| `PreMatch/Models/Teams/TeamWides.cs` | 5INRUB / 6INRUB | {Team} Innings Wides Faced |
| `PreMatch/Models/Teams/TeamDucks.cs` | 54PIN / 64PIN | {Team} Innings Ducks |
| `PreMatch/Models/Teams/TeamExtras.cs` | 54PINA / 64PINA | {Team} Innings Extras |
| `PreMatch/Models/Teams/TeamRunOuts.cs` | 5INRU / 6INRU | {Team} Innings Run Outs |
| `PreMatch/Models/Teams/TeamMaxOver.cs` | 5INRUA / 6INRUA | {Team} Max Runs in an Over |
| `PreMatch/Models/Teams/TeamFirstPartnership.cs` | 11FONW / 21FONW | {Team} Runs at Fall of 1st Wicket |
| `PreMatch/Models/Teams/TeamFirstDismissal.cs` | 11MOPD / 21MOPD | {Team} 1st Wicket Method of Dismissal |
| `PreMatch/Models/Groups/GroupRuns.cs` | 0RPGO{n} / 1|2RPGO{n} | Runs in First N Overs (rows 38–40 match, 138+ team) |
| `PreMatch/Models/Groups/GroupWickets.cs` | 0WPGO{n} | Wickets in First N Overs (rows 41–43) |
| `PreMatch/Models/Groups/TeamGroupRuns.cs` | 1|2RPGO{n}[A|B] | Team-only group runs (3 lines per group) |

## Base classes

| File | Extends | Used by |
|------|---------|---------|
| `HomeAwayMarketPricingModel.cs` | `MarketPricingModel<IPricingInputs>` | `TeamHomeAwayMarketPricingModel` |
| `PreMatch/Models/Teams/TeamHomeAwayMarketPricingModel.cs` | `HomeAwayMarketPricingModel` | `TeamTopBatter`, `TeamTopBowler` |
| `PreMatch/Models/Matches/MatchTopPlayer.cs` | `StandardMarketPricingModel` | `MatchTopBatter`, `MatchTopBowler` |
| `PreMatch/Models/Matches/MilestoneMarketModel.cs` | `StandardMarketPricingModel` | `FiftyInnings`, `HundredInnings`, `HundredMatch` |
| `PreMatch/Models/HeadToHeads/MatchDerivativeMarket.cs` | `HeadStandardMarketPricingModel` | `TeamOfTopBat`, `TeamOfTopBowl` |
| `PreMatch/Models/Groups/GroupStandardMarketPricingModel.cs` | `StandardMarketPricingModel` | `GroupRuns`, `GroupWickets`, `TeamGroupRuns` |
| `IMatchDerivativeMarket.cs` | — | `MatchDerivativeMarket` overload contract |

## Shared helpers

| File | Used by |
|------|---------|
| `PreMatch/Models/TopBatterMethods.cs` | MatchTopBatter, TeamTopBatter |

Paste additional models into the matching folder and tell Cursor to update the registry.
