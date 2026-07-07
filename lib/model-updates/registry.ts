import type { ModelUpdate } from "./types";

/** Atlas 196 T20 batter-milestone & progression changes (Jul 2026). */
export const modelUpdates: ModelUpdate[] = [
  {
    id: "t20-batter-25-yes-skew",
    title: "Shorten Yes price — Batter to score 25",
    summary:
      "Increase the live Pricing skew coefficient on the 25 milestone Yes row so published Yes prices shorten (higher implied probability).",
    category: "pricing_skew",
    formats: ["T20", "ODI", "all formats using Pricing!G545/G561 pattern"],
    phase: "live",
    atlas: {
      workbook: "Atlas 196 (3).xlsm",
      sheet: "Pricing",
      cells: ["G545", "G561"],
      changeSummary: "Raise skew multiplier from 0.0003 to 0.0015 in the MAX(…*(line−base),0) term.",
      before: "MAX(0.0003*(B545-$B$543),0)  — bat1 row 545 (milestone 25)",
      after: "MAX(0.0015*(B545-$B$543),0)",
      formulaNote:
        "G545 = bat1 To Score 25? skew (E545=25, B545=24.5). G561 is the bat2 mirror (E561=25). G column feeds D545 probability via INDEX($R$566:$DN$566,…) − G545.",
    },
    lambda: {
      layer: "model",
      targetHint:
        "InPlay.Players.PlayerRuns.GetBias() — Excel Pricing!G545/G561 buying-bias ramp",
      changeType: "constant",
      steps: [
        "File: PlayerRuns.cs, method GetBias(targetLine, mainLine, isT20, isMilestone: true).",
        "Atlas G545 uses MAX(0.0015*(line−base),0); Lambda applies underProb -= buyingBias, Yes = 1−underProb.",
        "Use coefficient 0.0015 when targetLine == 24 (milestone list value → market “To Score 25?”). Keep 0.0003 for other milestones (49, etc.).",
        "Do NOT change PlayersMarketPricingModel — that class builds battingAverage / distribution shape, not G-column skew.",
      ],
    },
    verification: [
      "Pick fixture with striker on 15–20 runs; Atlas Pricing D545 Yes prob should be higher than before (shorter Yes price).",
      "50/75/100 rows (G546–G548, G562–G564) unchanged.",
    ],
    status: "documented",
    relatedMarkets: ["{Batter} To Score 25?"],
  },
  {
    id: "t20-batter-75-no-skew",
    title: "Shorten No price — Batter to score 75 (T20)",
    summary:
      "Apply a fixed −0.01 probability skew on the 75 milestone No side in T20, instead of the default 0.0003 ramp (which was 0 for this row).",
    category: "pricing_skew",
    formats: ["T20"],
    phase: "live",
    atlas: {
      workbook: "Atlas 196 (3).xlsm",
      sheet: "Pricing",
      cells: ["G547", "G563"],
      changeSummary: 'T20 branch: IF(n_format_a="T20",-0.01,…) instead of IF(…,0,…).',
      before: 'IF(n_format_a="T20",0,MAX(0.0003*(B547-$B$543),0))',
      after: 'IF(n_format_a="T20",-0.01,MAX(0.0003*(B547-$B$543),0))',
      formulaNote:
        "Row 547 = bat1 To Score 75? (B547=74.5). G563 = bat2 mirror. Negative G increases No probability (shortens No price).",
    },
    lambda: {
      layer: "model",
      targetHint:
        "InPlay.Players.PlayerRuns.GetBias() — Excel Pricing!G547/G563 T20 branch",
      changeType: "conditional",
      steps: [
        "File: PlayerRuns.cs, GetBias(). Today: if (isT20 && isMilestone && targetLine > 49) return 0; — this hits milestone 74 (To Score 75) and 99.",
        "Change to: when isT20 && targetLine == 74, return -0.01 (underProb -= (-0.01) raises No / lowers Yes).",
        "Keep return 0 for targetLine == 99 if 100 market removed; ODI path still uses 0.0003 ramp for 74.",
      ],
    },
    verification: [
      "T20 fixture, striker < 75 runs: No on To Score 75? should shorten vs previous template.",
      "ODI fixture: G547 should still use 0.0003 ramp, not −0.01.",
    ],
    status: "documented",
    relatedMarkets: ["{Batter} To Score 75?"],
  },
  {
    id: "t20-batter-75-suspend-5-overs",
    title: "Suspend Batter to score 75 after 5 overs (not 10)",
    summary:
      "Stop offering live To Score 75? once fewer than 90 balls remain in the innings (i.e. after 5 overs in a T20).",
    category: "market_suspend",
    formats: ["T20"],
    phase: "live",
    atlas: {
      workbook: "Atlas 196 (3).xlsm",
      sheet: "Priority",
      cells: ["W211", "W231"],
      changeSummary: "Change balls-remaining threshold 60 → 90 in the suspend formula.",
      before: "=IF(c_balls_rem<60,0,1)",
      after: "=IF(c_balls_rem<90,0,1)",
      formulaNote:
        "Rows 211 / 231 = To Score 75? for bat1 / bat2. W=0 suspends the market. c_balls_rem = Input!S11 = n_max_overs×6 − c_balls. For T20: 90 balls rem = 30 balls bowled = 5 overs.",
    },
    lambda: {
      layer: "market_config",
      targetHint:
        "InPlay.Players.PlayerRuns.GetMarkets() — milestone spawn gate (replaces Priority!W211/W231)",
      changeType: "threshold",
      steps: [
        "File: PlayerRuns.cs, MILESTONE MARKETS block. Today 75 is added when wicketsLost < 5.5 only — no balls check.",
        "Add: only include milestone 74 when ballsRemaining >= 90 (T20/Hundred: 90 balls left = 5 overs completed).",
        "Format-specific: apply 90 threshold for T20/T10/Hundred; keep ODI/Test threshold separate if Atlas differs.",
        "Priority W211 is not in PlayersMarketPricingModel — implement suspend by omitting market from GetMarkets return list.",
      ],
    },
    verification: [
      "T20 at 5.0 overs completed: To Score 75? should suspend (Priority W=0).",
      "At 4.5 overs: market still offered (W=1).",
      "To Score 50? rows (210/230) still use W=1 without balls_rem gate unless separately configured.",
    ],
    status: "documented",
    relatedMarkets: ["{Batter} To Score 75?"],
  },
  {
    id: "t20-batter-100-no-offer",
    title: "Do not offer Batter to score 100",
    summary:
      "Disable pre-match and live offering of To Score 100? for both strikers.",
    category: "market_visibility",
    formats: ["T20", "all"],
    phase: "both",
    atlas: {
      workbook: "Atlas 196 (3).xlsm",
      sheet: "Priority",
      cells: ["Q212", "Q232"],
      changeSummary: "Set offer flag Q=0 for To Score 100? rows (was Q=1 on Q232 in older templates).",
      before: "Q232 = 1 (bat2 To Score 100 offered)",
      after: "Q212 = 0, Q232 = 0",
      formulaNote:
        "Row 212 / 232 = To Score 100? Q column controls whether market is in the offer set. W may remain 1 but Q=0 prevents spawn.",
    },
    lambda: {
      layer: "market_config",
      targetHint:
        "InPlay.Players.PlayerRuns.GetMarkets() — remove milestone 99 from spawn list",
      changeType: "spawn_flag",
      steps: [
        "File: PlayerRuns.cs — delete or gate the block: if (wicketsLost < 4.5 && !IsSRL) milestones.Add(99);",
        "Atlas Priority Q212/Q232=0; Lambda should never emit “To Score 100?” (all formats, not only SRL).",
        "MilestoneThresholds[99] check becomes dead code once 99 is never added.",
      ],
    },
    verification: [
      "New fixture: no To Score 100? in PM Publication or live offer list.",
      "Priority Q212 and Q232 both 0 in Atlas.",
    ],
    status: "documented",
    relatedMarkets: ["{Batter} To Score 100?"],
  },
  {
    id: "progdata-runs-in-over",
    title: "Update progression data — runs in over",
    summary:
      "Replace ProgData lookup tables used for over-by-over run rate progression (feeds live group/over markets and Pricing INDEX columns).",
    category: "lookup_data",
    formats: ["T20", "ODI", "Test"],
    phase: "live",
    atlas: {
      workbook: "Atlas 196 (3).xlsm",
      sheet: "ProgData",
      cells: ["M9:BK508"],
      changeSummary: "Copy full block from Atlas 196 template into deployment workbook ProgData.",
      formulaNote:
        "Prog Data (space) sheet is a separate live feed; ProgData is the static lookup grid. M9:BK508 spans format/over progression rates used by Pricing INDEX ranges ($R$566:$DN$566 etc.).",
    },
    lambda: {
      layer: "lookup",
      targetHint:
        "ILookupProvider resource tables — NOT PlayersMarketPricingModel or GetBias",
      changeType: "table_data",
      steps: [
        "ProgData!M9:BK508 feeds over-progression / INDEX curves (Pricing $R$566:$DN$566), not the Z763 battingAverage chain.",
        "Update lookup JSON/resources consumed by GetMilestoneFactorAdjust, InningsRuns, over-rate, or discretization tables — confirm which Lookup() maps to ProgData in pcs.lib.pricing.",
        "PlayersMarketPricingModel uses different lookups (T20SituationFactor, T20BatsmanBallsRemainingFactor, etc.) — only change those if ProgData diff affects AE804+ situation tables.",
        "Re-QA milestone probs and group/over markets after lookup version bump.",
      ],
    },
    verification: [
      "Diff ProgData M9:BK508 old vs Atlas 196 — zero unexpected gaps.",
      "Live over markets (1st over runs, group runs) match Atlas on 3+ fixed match states.",
    ],
    status: "documented",
    relatedMarkets: ["Runs in First Over", "Runs in First N Overs", "Batter milestone INDEX curves"],
  },
];

export function getModelUpdate(id: string) {
  return modelUpdates.find((u) => u.id === id);
}
