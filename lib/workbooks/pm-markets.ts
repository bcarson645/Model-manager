import templates from "./pm-market-templates.json";

export type PmMarketTemplate = {
  category: string;
  marketTemplate: string;
  exampleNames: string[];
  firstRow: number;
  lastRow: number;
  selectionCount: number;
  instanceCount: number;
};

/** Lambda C# class linked to a PM Publication market template name */
export const lambdaLinks: Record<string, string> = {
  "Match Betting": "MatchBetting",
  "Method of First Dismissal": "FirstDismissal",
  "Runs in First Partnership": "FirstPartnership",
  "Tied Match": "TiedMatch",
  "Toss/Win Double": "TossWinDouble",
  "Player - Runs": "PlayerRuns",
  "Match Top Bat.": "MatchTopBatter",
  "Match Top Bowler.": "MatchTopBowler",
  "Team of Top Bat": "TeamOfTopBat",
  "Team of Top Bowl": "TeamOfTopBowl",
  "- Top Bat": "TeamTopBatter",
  "- Top Bowl": "TeamTopBowler",
};

export const pmMarketTemplates = templates as PmMarketTemplate[];

export const pmMarketCategories = Array.from(
  new Set(pmMarketTemplates.map((m) => m.category))
).sort();

export function getPmMarketStats() {
  const byCategory: Record<string, number> = Object.fromEntries(
    pmMarketCategories.map((cat) => [
      cat,
      pmMarketTemplates.filter((m) => m.category === cat).length,
    ])
  );
  const withLambda = pmMarketTemplates.filter(
    (m) => lambdaLinks[m.marketTemplate]
  ).length;

  return {
    totalTemplates: pmMarketTemplates.length,
    totalSelections: pmMarketTemplates.reduce((s, m) => s + m.selectionCount, 0),
    byCategory,
    withLambda,
    withoutLambda: pmMarketTemplates.length - withLambda,
  };
}

export function getLambdaForTemplate(marketTemplate: string) {
  return lambdaLinks[marketTemplate] ?? null;
}
