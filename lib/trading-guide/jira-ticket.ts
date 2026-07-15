/**
 * JIRA ticket scaffold for wiring a pricing model into the trading UI.
 */
import {
  formatPmValue,
  getPmQaFixture,
  type PmPublicationSelection,
} from "@/lib/workbooks/pm-publication-qa";
import type { MarketTradingGuide } from "./types";

export type JiraAcceptanceCriterion = {
  id: string;
  text: string;
  kind: "functional" | "expected_value" | "wiring" | "ui";
};

export type JiraProcessStep = {
  step: number;
  title: string;
  detail: string;
};

export type JiraTicketDraft = {
  summary: string;
  issueTypeHint: string;
  labels: string[];
  description: string;
  processFlow: JiraProcessStep[];
  acceptanceCriteria: JiraAcceptanceCriterion[];
  /** Plain text / markdown suitable for pasting into JIRA */
  pasteText: string;
};

function isNumericCell(value: PmPublicationSelection["probability"]): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function selectionLabel(sel: PmPublicationSelection): string {
  return sel.selection?.trim() || sel.market || `Row ${sel.row}`;
}

/** Default expected probs / lines from PM Publication + prep hints (adjust = 0 baseline). */
export function buildExpectedValueCriteria(
  guide: MarketTradingGuide
): JiraAcceptanceCriterion[] {
  const criteria: JiraAcceptanceCriterion[] = [];
  const fixture = getPmQaFixture(guide.pmQaFixtureId);
  const hints = fixture.prepHints[guide.registryModelId] ?? [];

  for (const hint of hints) {
    if (!hint.expected) continue;
    const field = hint.field === "line" ? "line" : "probability";
    criteria.push({
      id: `hint-${field}`,
      kind: "expected_value",
      text: `With default inputs (trader adjust = 0), published ${field} matches ~${hint.expected} (${hint.note}; fixture ${fixture.label}).`,
    });
  }

  for (const sel of guide.pmQaSelections) {
    const label = selectionLabel(sel);
    const cells = sel.cells;

    if (isNumericCell(sel.line)) {
      criteria.push({
        id: `line-${sel.row}`,
        kind: "expected_value",
        text: `Default line for “${label}” equals ${formatPmValue(sel.line)} (${cells.line}) within ±0.01 of sheet default.`,
      });
    }

    if (isNumericCell(sel.probability)) {
      const complement =
        isNumericCell(sel.complementProbability) &&
        typeof sel.complementProbability === "number"
          ? ` Complement ≈ ${formatPmValue(sel.complementProbability)} (${cells.complement}).`
          : "";
      criteria.push({
        id: `prob-${sel.row}`,
        kind: "expected_value",
        text: `Default probability for “${label}” equals ${formatPmValue(sel.probability)} (${cells.probability}) within ±0.01 of sheet default (I adjust = 0).${complement}`,
      });
    }
  }

  // De-dupe near-identical texts
  const seen = new Set<string>();
  return criteria.filter((c) => {
    if (seen.has(c.text)) return false;
    seen.add(c.text);
    return true;
  });
}

export function buildJiraProcessFlow(guide: MarketTradingGuide): JiraProcessStep[] {
  const wiring = guide.integrationWiring;
  const steps: JiraProcessStep[] = [
    {
      step: 1,
      title: "Map evaluation inputs",
      detail:
        wiring.fromPlayerAdjustment.length > 0
          ? `Ensure Player Adjustment / prep exports: ${wiring.fromPlayerAdjustment.join("; ")}.`
          : "Confirm fixture + format on evaluation payload (minimal inputs).",
    },
    {
      step: 2,
      title: "Wire extra evaluation fields",
      detail:
        wiring.extraEvaluationInputs.length > 0
          ? wiring.extraEvaluationInputs
              .map((i) => `${i.label} [${i.status}] — ${i.detail}`)
              .join(" ")
          : "No extra evaluation fields beyond shared match payload.",
    },
    {
      step: 3,
      title: "Call Lambda market",
      detail: `Invoke ${guide.className} (${guide.marketCode || "n/a"}) and capture base outcomes / line.`,
    },
    {
      step: 4,
      title: "Market Configuration UI",
      detail:
        wiring.marketConfiguration.length > 0
          ? wiring.marketConfiguration.join(" ")
          : `Render ${guide.marketName} in Market Configuration (prob / line / adjust / price).`,
    },
    {
      step: 5,
      title: "Apply trader adjust post-model",
      detail:
        guide.traderAdjusts.length > 0
          ? `Store purple skew (e.g. ${guide.excelTrading?.adjustCell ?? guide.excelTrading?.adjustCells?.join(", ") ?? "column I"}); apply after Lambda per skew guide (${guide.traderSkewGuide.kind}).`
          : "No trader skew on this market — display Lambda base output only.",
    },
    {
      step: 6,
      title: "QA against default fixture",
      detail: `Compare published outputs to ${fixtureLabel(guide)} defaults (adjust = 0) before marking matched.`,
    },
  ];
  return steps;
}

function fixtureLabel(guide: MarketTradingGuide): string {
  return getPmQaFixture(guide.pmQaFixtureId).label;
}

export function buildJiraAcceptanceCriteria(
  guide: MarketTradingGuide
): JiraAcceptanceCriterion[] {
  const wiring = guide.integrationWiring;
  const criteria: JiraAcceptanceCriterion[] = [
    {
      id: "ac-market-row",
      kind: "ui",
      text: `${guide.marketName} appears in Market Configuration${guide.excelTrading?.rows ? ` (PM rows ${guide.excelTrading.rows})` : ""} with correct market code ${guide.marketCode || "(TBC)"}.`,
    },
    {
      id: "ac-lambda",
      kind: "functional",
      text: `Pricing call returns ${guide.className} outcomes; UI displays base probabilities and/or line without requiring a non-zero trader adjust.`,
    },
  ];

  for (const item of wiring.extraEvaluationInputs.filter((i) => i.status === "need")) {
    criteria.push({
      id: `ac-need-${item.id}`,
      kind: "wiring",
      text: `Evaluation payload includes ${item.label}: ${item.detail}`,
    });
  }

  if (guide.traderAdjusts.length > 0) {
    criteria.push({
      id: "ac-adjust",
      kind: "functional",
      text: `Trader adjust control is available; +1 / −1 (or documented unit) updates published values after Lambda per ${guide.traderSkewGuide.kind} rules.`,
    });
  }

  const expected = buildExpectedValueCriteria(guide);
  if (expected.length === 0) {
    criteria.push({
      id: "ac-expected-placeholder",
      kind: "expected_value",
      text: `With default fixture inputs and adjust = 0, published probs/lines match captured PM Publication for ${fixtureLabel(guide)} (capture expected values from QA tab if missing).`,
    });
  } else {
    criteria.push(...expected);
  }

  criteria.push({
    id: "ac-matched",
    kind: "wiring",
    text: "Model Manager Overview can mark this market Matched once QA passes on the default fixture.",
  });

  return criteria;
}

function statusBlurb(guide: MarketTradingGuide): string {
  const w = guide.integrationWiring;
  if (w.connected && w.connectedNote) return `*Status:* Connected — ${w.connectedNote}`;
  return `*Readiness:* ${w.readiness} — ${w.readinessSummary}`;
}

export function buildJiraTicketDraft(guide: MarketTradingGuide): JiraTicketDraft {
  const processFlow = buildJiraProcessFlow(guide);
  const acceptanceCriteria = buildJiraAcceptanceCriteria(guide);
  const summary = `[PM] Wire ${guide.marketName} (${guide.marketCode || guide.className}) to trading UI`;

  const description = [
    `Wire pre-match market *${guide.marketName}* into Player Adjustment → Lambda → Market Configuration.`,
    "",
    `*Lambda:* \`${guide.lambdaClass}\``,
    `*Registry:* \`${guide.registryModelId}\``,
    guide.excelTrading
      ? `*Excel today:* ${guide.excelTrading.sheet} rows ${guide.excelTrading.rows ?? "—"} (${guide.excelTrading.market ?? guide.marketName})`
      : "*Excel today:* PM Publication mapping TBC",
    `*Default QA fixture:* ${fixtureLabel(guide)}`,
    "",
    guide.description,
    "",
    statusBlurb(guide),
  ].join("\n");

  const pasteText = formatJiraPaste({
    summary,
    description,
    processFlow,
    acceptanceCriteria,
  });

  return {
    summary,
    issueTypeHint: "Story",
    labels: ["pre-match", "trading-ui", "lambda", guide.registryModelId],
    description,
    processFlow,
    acceptanceCriteria,
    pasteText,
  };
}

export function formatJiraPaste(draft: {
  summary: string;
  description: string;
  processFlow: JiraProcessStep[];
  acceptanceCriteria: JiraAcceptanceCriterion[];
}): string {
  const lines: string[] = [
    `h2. ${draft.summary}`,
    "",
    draft.description,
    "",
    "h3. Process flow",
    ...draft.processFlow.map(
      (s) => `# *${s.title}* — ${s.detail}`
    ),
    "",
    "h3. Acceptance criteria",
    ...draft.acceptanceCriteria.map((ac, i) => {
      const tag =
        ac.kind === "expected_value"
          ? " (expected value)"
          : ac.kind === "wiring"
            ? " (wiring)"
            : "";
      return `* [ ] AC${i + 1}${tag}: ${ac.text}`;
    }),
  ];
  return lines.join("\n");
}
