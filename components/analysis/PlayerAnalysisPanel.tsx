"use client";

import { useMemo, useState } from "react";
import {
  buildPlayerDatabase,
  computeDismissalMix,
  filterPlayerRecord,
  type PlayerRecord,
} from "@/lib/scorecards/player-db";
import {
  computeBattingBySeason,
  computeBattingSummary,
  computeBowlingBySeason,
  computeBowlingSummary,
  computeScoreDistribution,
  recentBowlingSpells,
  recentScores,
} from "@/lib/scorecards/player-stats";
import {
  buildCareerBattingProgress,
  buildCareerBowlingProgress,
  buildCareerRelativeBattingProgress,
  buildPlayerBrowseIndex,
  compareBowlingFormWindows,
  compareFormWindows,
  compareRelativeFormWindows,
  playersForCountryTeam,
} from "@/lib/scorecards/player-form";
import { getMatchesForFormat, formatLabel } from "@/lib/scorecards/format-source";
import type { DataFormat } from "@/lib/scorecards/types";
import { PlayerCareerFormChart } from "./PlayerCareerFormChart";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import {
  DashBadge,
  DashCard,
  DashEmpty,
  DashGrid,
  DashHeader,
  DashPage,
  DashScrollTable,
  DashSplit,
  DashStat,
  DashTabs,
} from "./AnalysisDashboard";

type PlayerAnalysisPanelProps = {
  format: DataFormat;
};

type PlayerTab = "batting" | "bowling" | "h2h";

function fmt(n: number | null, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function deltaClass(delta: number | null, higherIsBetter: boolean): string {
  if (delta == null || Math.abs(delta) < 0.05) return "text-slate-400";
  const up = delta > 0;
  const good = higherIsBetter ? up : !up;
  return good ? "text-emerald-300" : "text-rose-300";
}

function formatDelta(delta: number | null, digits = 1): string {
  if (delta == null || Number.isNaN(delta)) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(digits)}`;
}

/** Display overs in cricket notation (4.2 = 4 overs + 2 balls). */
function formatOvers(overs: number): string {
  const whole = Math.floor(overs + 1e-9);
  const balls = Math.round((overs - whole) * 6);
  if (balls <= 0) return String(whole);
  if (balls >= 6) return String(whole + 1);
  return `${whole}.${balls}`;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white disabled:opacity-40";

export function PlayerAnalysisPanel({ format }: PlayerAnalysisPanelProps) {
  const matches = useMemo(() => getMatchesForFormat(format), [format]);
  const db = useMemo(() => buildPlayerDatabase(matches), [matches]);
  const browse = useMemo(
    () => buildPlayerBrowseIndex(matches, db.players),
    [matches, db.players]
  );

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [tab, setTab] = useState<PlayerTab>("batting");
  const [tournament, setTournament] = useState<string>("all");
  const [country, setCountry] = useState("");
  const [team, setTeam] = useState("");
  const [scoreBandWidth, setScoreBandWidth] = useState(5);

  const teamsForCountry = useMemo(() => {
    if (!country) return [];
    return browse.teamsByCountry.get(country) ?? [];
  }, [browse.teamsByCountry, country]);

  const playersForTeam = useMemo(() => {
    if (!country || !team) return [];
    return playersForCountryTeam(browse, country, team);
  }, [browse, country, team]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return db.players.slice(0, 30);
    return db.players
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [db.players, search]);

  const player: PlayerRecord | undefined = selectedId
    ? db.byId.get(selectedId)
    : undefined;

  const tournaments = player?.tournaments ?? [];

  const filtered = player
    ? filterPlayerRecord(player, tournament as string | "all")
    : { battingInnings: [], bowlingInnings: [] };

  const batting = computeBattingSummary(filtered.battingInnings);
  const bowling = computeBowlingSummary(filtered.bowlingInnings);
  const battingBySeason = computeBattingBySeason(filtered.battingInnings);
  const bowlingBySeason = computeBowlingBySeason(filtered.bowlingInnings);
  const recent = recentScores(filtered.battingInnings, 8);
  const recentBowling = recentBowlingSpells(filtered.bowlingInnings, 8);

  const careerProgress = useMemo(
    () => buildCareerBattingProgress(filtered.battingInnings, 10),
    [filtered.battingInnings]
  );
  const formWindows = useMemo(
    () => compareFormWindows(filtered.battingInnings, [10, 20]),
    [filtered.battingInnings]
  );
  const relativeProgress = useMemo(
    () => buildCareerRelativeBattingProgress(filtered.battingInnings, 10),
    [filtered.battingInnings]
  );
  const relativeWindows = useMemo(
    () => compareRelativeFormWindows(filtered.battingInnings, [10, 20]),
    [filtered.battingInnings]
  );
  const bowlingProgress = useMemo(
    () => buildCareerBowlingProgress(filtered.bowlingInnings, 10),
    [filtered.bowlingInnings]
  );
  const bowlingFormWindows = useMemo(
    () => compareBowlingFormWindows(filtered.bowlingInnings, [10, 20]),
    [filtered.bowlingInnings]
  );

  const datasetBatting = useMemo(
    () =>
      db.players.flatMap((p) =>
        filterPlayerRecord(p, tournament as string | "all").battingInnings
      ),
    [db.players, tournament]
  );

  const dismissalMix = player
    ? computeDismissalMix(filtered.battingInnings, datasetBatting)
    : null;

  const scoreDistribution = useMemo(
    () =>
      filtered.battingInnings.length > 0
        ? computeScoreDistribution(
            filtered.battingInnings,
            datasetBatting,
            scoreBandWidth
          )
        : null,
    [filtered.battingInnings, datasetBatting, scoreBandWidth]
  );

  function selectPlayer(id: string, name: string) {
    setSelectedId(id);
    setSearch(name);
    setTournament("all");
  }

  if (matches.length === 0) {
    return (
      <DashPage>
        <DashEmpty>No {formatLabel(format)} data for player analysis.</DashEmpty>
      </DashPage>
    );
  }

  const picker = (
    <DashCard span="full" title="Find player" compact>
      <p className="mb-3 text-xs text-slate-500">
        {db.players.length.toLocaleString()} players ·{" "}
        {matches.length.toLocaleString()} matches
      </p>
      <label className="block text-xs text-slate-400">
        Search
        <input
          type="search"
          placeholder="Player name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={fieldClass}
        />
      </label>
      {search && filteredPlayers.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-surface-border bg-surface">
          {filteredPlayers.map((p) => (
            <li key={p.playerId}>
              <button
                type="button"
                onClick={() => selectPlayer(p.playerId, p.name)}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-surface-raised"
              >
                {p.name}{" "}
                <span className="text-slate-500">
                  · {p.battingInnings.length} inn
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-surface-border pt-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Browse
        </p>
        <div className="mt-2 space-y-2">
          <label className="block text-xs text-slate-400">
            Country
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setTeam("");
              }}
              className={fieldClass}
            >
              <option value="">Select…</option>
              {browse.countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Team
            <select
              value={team}
              disabled={!country}
              onChange={(e) => setTeam(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select…</option>
              {teamsForCountry.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Player
            <select
              value={
                playersForTeam.some((p) => p.playerId === selectedId)
                  ? selectedId
                  : ""
              }
              disabled={!team}
              onChange={(e) => {
                const id = e.target.value;
                const found = playersForTeam.find((p) => p.playerId === id);
                if (found) selectPlayer(found.playerId, found.name);
              }}
              className={fieldClass}
            >
              <option value="">Select…</option>
              {playersForTeam.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {p.name} ({p.innings} inn)
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </DashCard>
  );

  return (
    <DashPage>
      <DashHeader
        title="Player analysis"
        badge={<DashBadge>{formatLabel(format)}</DashBadge>}
        subtitle="Career form, match-relative scoring, and bowling progression"
      />

      <DashSplit sidebar={picker}>
        {!player ? (
          <DashEmpty>
            Search or browse country → team → player to open the dashboard.
          </DashEmpty>
        ) : (
          <>
            <DashCard span="full" compact>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-white">
                    {player.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {player.teams.join(", ")}
                  </p>
                </div>
                <select
                  value={tournament}
                  onChange={(e) => setTournament(e.target.value)}
                  className="w-full shrink-0 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white sm:w-auto"
                >
                  <option value="all">All tournaments</option>
                  {tournaments.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 border-t border-surface-border pt-3">
                <DashTabs
                  tabs={[
                    { id: "batting" as const, label: "Batting" },
                    { id: "bowling" as const, label: "Bowling" },
                    { id: "h2h" as const, label: "H2H" },
                  ]}
                  value={tab}
                  onChange={setTab}
                />
              </div>
            </DashCard>

            {tab === "batting" && (
              <>
                <DashGrid>
                  <DashStat label="Matches" value={batting.matches} />
                  <DashStat label="Innings" value={batting.innings} />
                  <DashStat label="Runs" value={batting.runs} accent />
                  <DashStat label="Average" value={fmt(batting.average)} />
                  <DashStat label="Strike rate" value={fmt(batting.strikeRate)} />
                  <DashStat label="High score" value={batting.highScore} />
                  <DashStat label="50s" value={batting.fifties} />
                  <DashStat label="100s" value={batting.hundreds} />
                </DashGrid>

                {recent.length > 0 && (
                  <DashCard span="full" title="Recent scores" compact>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((inn) => (
                        <span
                          key={`${inn.matchId}-${inn.runs}-${inn.balls}-${inn.date}`}
                          className="rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 font-mono text-sm text-slate-300"
                          title={`${inn.date} vs ${inn.opponent}`}
                        >
                          {inn.runs}
                          {inn.notOut ? "*" : ""}
                          <span className="text-slate-500">
                            ({inn.balls})
                          </span>
                        </span>
                      ))}
                    </div>
                  </DashCard>
                )}

                {careerProgress.length >= 2 && (
                  <>
                    <DashGrid>
                      {formWindows.map((w) => (
                        <DashCard
                          key={w.window}
                          span="half"
                          title={`Last ${w.window} vs career`}
                          description={`${w.innings} inn · ${w.runs} runs`}
                          compact
                        >
                          <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <dt className="text-xs text-slate-500">Average</dt>
                              <dd className="font-mono text-white">
                                {fmt(w.average)}{" "}
                                <span className={deltaClass(w.averageDelta, true)}>
                                  ({formatDelta(w.averageDelta)})
                                </span>
                              </dd>
                              <dd className="text-xs text-slate-500">
                                Career {fmt(w.careerAverage)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">Strike rate</dt>
                              <dd className="font-mono text-white">
                                {fmt(w.strikeRate)}{" "}
                                <span
                                  className={deltaClass(w.strikeRateDelta, true)}
                                >
                                  ({formatDelta(w.strikeRateDelta)})
                                </span>
                              </dd>
                              <dd className="text-xs text-slate-500">
                                Career {fmt(w.careerStrikeRate)}
                              </dd>
                            </div>
                          </dl>
                        </DashCard>
                      ))}
                    </DashGrid>

                    <DashGrid>
                      <DashCard span="half" title="Batting average" compact>
                        <div className="overflow-x-auto">
                          <PlayerCareerFormChart
                            points={careerProgress}
                            cumulativeKey="cumulativeAverage"
                            rollingKey="rollingAverage"
                            title=""
                            unitLabel="Ave"
                            yDigits={1}
                          />
                        </div>
                      </DashCard>
                      <DashCard span="half" title="Strike rate" compact>
                        <div className="overflow-x-auto">
                          <PlayerCareerFormChart
                            points={careerProgress}
                            cumulativeKey="cumulativeStrikeRate"
                            rollingKey="rollingStrikeRate"
                            title=""
                            unitLabel="SR"
                            yDigits={1}
                          />
                        </div>
                      </DashCard>
                    </DashGrid>
                  </>
                )}

                {relativeProgress.length >= 2 && (
                  <>
                    <DashCard
                      span="full"
                      title="Vs match context"
                      description="Index 1.0 = match par (runs ÷ innings RPW, SR ÷ innings SR)."
                      compact
                    >
                      <DashGrid className="!gap-3">
                        {relativeWindows.map((w) => (
                          <DashCard
                            key={w.window}
                            span="half"
                            title={`Last ${w.window} (relative)`}
                            description={`${w.innings} inn`}
                            compact
                          >
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <dt className="text-xs text-slate-500">
                                  Runs vs RPW
                                </dt>
                                <dd className="font-mono text-white">
                                  {fmt(w.runsIndex, 2)}×{" "}
                                  <span
                                    className={deltaClass(w.runsIndexDelta, true)}
                                  >
                                    ({formatDelta(w.runsIndexDelta, 2)})
                                  </span>
                                </dd>
                                <dd className="text-xs text-slate-500">
                                  Career {fmt(w.careerRunsIndex, 2)}×
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-slate-500">
                                  SR vs match
                                </dt>
                                <dd className="font-mono text-white">
                                  {fmt(w.strikeRateIndex, 2)}×{" "}
                                  <span
                                    className={deltaClass(
                                      w.strikeRateIndexDelta,
                                      true
                                    )}
                                  >
                                    ({formatDelta(w.strikeRateIndexDelta, 2)})
                                  </span>
                                </dd>
                                <dd className="text-xs text-slate-500">
                                  Career {fmt(w.careerStrikeRateIndex, 2)}×
                                </dd>
                              </div>
                            </dl>
                          </DashCard>
                        ))}
                      </DashGrid>
                    </DashCard>

                    <DashGrid>
                      <DashCard span="half" title="Runs vs match average" compact>
                        <div className="overflow-x-auto">
                          <PlayerCareerFormChart
                            points={relativeProgress.map((p) => ({
                              ...p,
                              tooltip: `Inn ${p.inningsIndex}: ${p.runs}${
                                p.notOut ? "*" : ""
                              } vs RPW ${
                                p.matchRunsPerWicket?.toFixed(1) ?? "—"
                              } → ${p.runsIndex?.toFixed(2) ?? "—"}×`,
                            }))}
                            cumulativeKey="cumulativeRunsIndex"
                            rollingKey="rollingRunsIndex"
                            title=""
                            unitLabel="index"
                            referenceLine={1}
                            yDigits={2}
                          />
                        </div>
                      </DashCard>
                      <DashCard span="half" title="SR vs match" compact>
                        <div className="overflow-x-auto">
                          <PlayerCareerFormChart
                            points={relativeProgress.map((p) => ({
                              ...p,
                              tooltip: `Inn ${p.inningsIndex}: SR index ${
                                p.strikeRateIndex?.toFixed(2) ?? "—"
                              }×`,
                            }))}
                            cumulativeKey="cumulativeStrikeRateIndex"
                            rollingKey="rollingStrikeRateIndex"
                            title=""
                            unitLabel="index"
                            referenceLine={1}
                            yDigits={2}
                          />
                        </div>
                      </DashCard>
                    </DashGrid>
                  </>
                )}

                <DashGrid>
                  {battingBySeason.length > 0 && (
                    <DashCard
                      span={
                        dismissalMix && dismissalMix.playerDismissals > 0
                          ? "half"
                          : "full"
                      }
                      title="Year by year"
                      compact
                    >
                      <DashScrollTable>
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-2 py-2 sm:px-3">Season</th>
                              <th className="px-2 py-2 sm:px-3">Mat</th>
                              <th className="px-2 py-2 sm:px-3">Inns</th>
                              <th className="px-2 py-2 sm:px-3">Runs</th>
                              <th className="px-2 py-2 sm:px-3">Ave</th>
                              <th className="px-2 py-2 sm:px-3">SR</th>
                              <th className="px-2 py-2 sm:px-3">50s</th>
                              <th className="px-2 py-2 sm:px-3">100s</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border text-slate-300">
                            {battingBySeason.map((row) => (
                              <tr key={row.season}>
                                <td className="px-2 py-2 sm:px-3">{row.season}</td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.matches}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.innings}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.runs}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {fmt(row.average)}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {fmt(row.strikeRate)}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.fifties}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.hundreds}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DashScrollTable>
                    </DashCard>
                  )}

                  {dismissalMix && dismissalMix.playerDismissals > 0 && (
                    <DashCard
                      span="half"
                      title="Dismissal mix"
                      description={`vs dataset · ≥1.5σ or ≥6pp highlighted`}
                      compact
                    >
                      <DashScrollTable>
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-2 py-2">Type</th>
                              <th className="px-2 py-2">Player</th>
                              <th className="px-2 py-2">Avg</th>
                              <th className="px-2 py-2">Δ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dismissalMix.rows.map((row) => (
                              <tr
                                key={row.category}
                                className={
                                  row.highlighted
                                    ? row.vsAvgPp > 0
                                      ? "bg-emerald-950/40 text-emerald-200"
                                      : "bg-red-950/30 text-red-200"
                                    : "text-slate-300"
                                }
                              >
                                <td className="px-2 py-2">{row.category}</td>
                                <td className="px-2 py-2 font-mono">
                                  {row.playerPct.toFixed(0)}%
                                </td>
                                <td className="px-2 py-2 font-mono">
                                  {row.datasetPct.toFixed(0)}%
                                </td>
                                <td className="px-2 py-2 font-mono">
                                  {row.vsAvgPp >= 0 ? "+" : ""}
                                  {row.vsAvgPp.toFixed(0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DashScrollTable>
                    </DashCard>
                  )}
                </DashGrid>

                {scoreDistribution && (
                  <DashCard
                    span="full"
                    title="Score distribution vs dataset"
                    description="Frequency by score band vs all batters in the current filter. Highlighted bands differ significantly from the dataset mean."
                    compact
                  >
                    <ScoreDistributionChart
                      distribution={scoreDistribution}
                      bucketWidth={scoreBandWidth}
                      onBucketWidthChange={setScoreBandWidth}
                    />
                  </DashCard>
                )}
              </>
            )}

            {tab === "bowling" &&
              (bowling.innings === 0 ? (
                <DashEmpty>No bowling data for this filter.</DashEmpty>
              ) : (
                <>
                  <DashGrid>
                    <DashStat label="Matches" value={bowling.matches} />
                    <DashStat label="Wickets" value={bowling.wickets} accent />
                    <DashStat label="Average" value={fmt(bowling.average)} />
                    <DashStat
                      label="Economy"
                      value={fmt(bowling.economy, 2)}
                    />
                    <DashStat
                      label="Strike rate"
                      value={fmt(bowling.strikeRate)}
                    />
                    <DashStat label="Best" value={bowling.bestFigures} />
                    <DashStat
                      label="5W matches"
                      value={bowling.fiveWicketMatches}
                    />
                    <DashStat label="Maidens" value={bowling.maidens} />
                  </DashGrid>

                  {recentBowling.length > 0 && (
                    <DashCard span="full" title="Recent bowling" compact>
                      <div className="flex flex-wrap gap-2">
                        {recentBowling.map((inn) => {
                          const oversLabel = formatOvers(inn.overs);
                          return (
                            <span
                              key={`${inn.matchId}-${inn.wickets}-${inn.runs}-${inn.date}`}
                              className="rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 font-mono text-sm text-slate-300"
                              title={`${inn.date} vs ${inn.opponent} · ${oversLabel} ov${
                                inn.maidens > 0 ? ` · ${inn.maidens} maidens` : ""
                              }`}
                            >
                              {inn.wickets}/{inn.runs}
                              <span className="text-slate-500">
                                {" "}
                                ({oversLabel})
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </DashCard>
                  )}

                  {bowlingProgress.length >= 2 && (
                    <>
                      <DashGrid>
                        {bowlingFormWindows.map((w) => (
                          <DashCard
                            key={w.window}
                            span="half"
                            title={`Last ${w.window} spells`}
                            description={`${w.innings} inn · ${w.wickets} wkts · lower better`}
                            compact
                          >
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <dt className="text-xs text-slate-500">Average</dt>
                                <dd className="font-mono text-white">
                                  {fmt(w.average)}{" "}
                                  <span
                                    className={deltaClass(w.averageDelta, false)}
                                  >
                                    ({formatDelta(w.averageDelta)})
                                  </span>
                                </dd>
                                <dd className="text-xs text-slate-500">
                                  Career {fmt(w.careerAverage)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-slate-500">Economy</dt>
                                <dd className="font-mono text-white">
                                  {fmt(w.economy, 2)}{" "}
                                  <span
                                    className={deltaClass(w.economyDelta, false)}
                                  >
                                    ({formatDelta(w.economyDelta, 2)})
                                  </span>
                                </dd>
                                <dd className="text-xs text-slate-500">
                                  Career {fmt(w.careerEconomy, 2)}
                                </dd>
                              </div>
                            </dl>
                          </DashCard>
                        ))}
                      </DashGrid>

                      <DashGrid>
                        <DashCard span="half" title="Bowling average" compact>
                          <div className="overflow-x-auto">
                            <PlayerCareerFormChart
                              points={bowlingProgress}
                              cumulativeKey="cumulativeAverage"
                              rollingKey="rollingAverage"
                              title=""
                              unitLabel="Ave"
                              yDigits={1}
                            />
                          </div>
                        </DashCard>
                        <DashCard span="half" title="Economy" compact>
                          <div className="overflow-x-auto">
                            <PlayerCareerFormChart
                              points={bowlingProgress}
                              cumulativeKey="cumulativeEconomy"
                              rollingKey="rollingEconomy"
                              title=""
                              unitLabel="Econ"
                              yDigits={2}
                            />
                          </div>
                        </DashCard>
                      </DashGrid>
                    </>
                  )}

                  {bowlingBySeason.length > 0 && (
                    <DashCard span="full" title="Year by year" compact>
                      <DashScrollTable>
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-2 py-2 sm:px-3">Season</th>
                              <th className="px-2 py-2 sm:px-3">Mat</th>
                              <th className="px-2 py-2 sm:px-3">Wkts</th>
                              <th className="px-2 py-2 sm:px-3">Ave</th>
                              <th className="px-2 py-2 sm:px-3">Econ</th>
                              <th className="px-2 py-2 sm:px-3">SR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border text-slate-300">
                            {bowlingBySeason.map((row) => (
                              <tr key={row.season}>
                                <td className="px-2 py-2 sm:px-3">{row.season}</td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.matches}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {row.wickets}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {fmt(row.average)}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {fmt(row.economy, 2)}
                                </td>
                                <td className="px-2 py-2 font-mono sm:px-3">
                                  {fmt(row.strikeRate)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DashScrollTable>
                    </DashCard>
                  )}
                </>
              ))}

            {tab === "h2h" && (
              <DashEmpty>Head-to-head comparisons — coming soon.</DashEmpty>
            )}
          </>
        )}
      </DashSplit>
    </DashPage>
  );
}
