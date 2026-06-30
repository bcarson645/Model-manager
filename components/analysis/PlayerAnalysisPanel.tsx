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
  recentScores,
} from "@/lib/scorecards/player-stats";
import { getMatchesForFormat, formatLabel } from "@/lib/scorecards/format-source";
import type { DataFormat } from "@/lib/scorecards/types";

type PlayerAnalysisPanelProps = {
  format: DataFormat;
};

type PlayerTab = "batting" | "bowling" | "h2h";

function fmt(n: number | null, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function PlayerAnalysisPanel({ format }: PlayerAnalysisPanelProps) {
  const matches = useMemo(() => getMatchesForFormat(format), [format]);
  const db = useMemo(() => buildPlayerDatabase(matches), [matches]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [tab, setTab] = useState<PlayerTab>("batting");
  const [tournament, setTournament] = useState<string>("all");

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

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
        No {formatLabel(format)} data for player analysis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Player analysis</h2>
        <p className="mt-1 text-sm text-slate-400">
          {db.players.length.toLocaleString()} players aggregated from{" "}
          {matches.length.toLocaleString()} matches
        </p>
        <input
          type="search"
          placeholder="Search player name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-4 w-full max-w-md rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
        />
        {search && filteredPlayers.length > 0 && (
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-surface-border bg-surface">
            {filteredPlayers.map((p) => (
              <li key={p.playerId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(p.playerId);
                    setSearch(p.name);
                  }}
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
      </section>

      {player ? (
        <>
          <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{player.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {player.teams.join(", ")}
                </p>
              </div>
              <select
                value={tournament}
                onChange={(e) => setTournament(e.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
              >
                <option value="all">All tournaments</option>
                {tournaments.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <nav className="mt-4 flex gap-2">
              {(["batting", "bowling", "h2h"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    tab === t
                      ? "bg-emerald-600/20 text-emerald-300"
                      : "text-slate-400 hover:bg-surface hover:text-slate-200"
                  }`}
                >
                  {t === "h2h" ? "H2H" : t}
                </button>
              ))}
            </nav>
          </section>

          {tab === "batting" && (
            <div className="space-y-6">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Matches", batting.matches],
                  ["Innings", batting.innings],
                  ["Runs", batting.runs],
                  ["Average", fmt(batting.average)],
                  ["Strike rate", fmt(batting.strikeRate)],
                  ["High score", batting.highScore],
                  ["50s", batting.fifties],
                  ["100s", batting.hundreds],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-surface-border bg-surface p-4"
                  >
                    <p className="text-xs uppercase text-slate-500">{label}</p>
                    <p className="mt-1 font-mono text-xl text-white">{val}</p>
                  </div>
                ))}
              </section>

              {recent.length > 0 && (
                <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
                  <h4 className="text-sm font-semibold text-white">Recent scores</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recent.map((inn) => (
                      <span
                        key={`${inn.matchId}-${inn.runs}`}
                        className="rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-slate-300"
                        title={`${inn.date} vs ${inn.opponent}`}
                      >
                        {inn.runs}
                        {inn.notOut ? "*" : ""}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {battingBySeason.length > 0 && (
                <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
                  <h4 className="text-sm font-semibold text-white">Year by year</h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Season</th>
                          <th className="px-3 py-2">Mat</th>
                          <th className="px-3 py-2">Inns</th>
                          <th className="px-3 py-2">Runs</th>
                          <th className="px-3 py-2">Ave</th>
                          <th className="px-3 py-2">SR</th>
                          <th className="px-3 py-2">50s</th>
                          <th className="px-3 py-2">100s</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-slate-300">
                        {battingBySeason.map((row) => (
                          <tr key={row.season}>
                            <td className="px-3 py-2">{row.season}</td>
                            <td className="px-3 py-2 font-mono">{row.matches}</td>
                            <td className="px-3 py-2 font-mono">{row.innings}</td>
                            <td className="px-3 py-2 font-mono">{row.runs}</td>
                            <td className="px-3 py-2 font-mono">{fmt(row.average)}</td>
                            <td className="px-3 py-2 font-mono">{fmt(row.strikeRate)}</td>
                            <td className="px-3 py-2 font-mono">{row.fifties}</td>
                            <td className="px-3 py-2 font-mono">{row.hundreds}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {dismissalMix && dismissalMix.playerDismissals > 0 && (
                <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
                  <h4 className="text-sm font-semibold text-white">Dismissal mix</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Player ({dismissalMix.playerDismissals} dismissals) vs dataset (
                    {dismissalMix.datasetDismissals.toLocaleString()} dismissals).
                    Highlighted rows: ≥1.5σ or ≥6pp vs dataset.
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Dismissal</th>
                          <th className="px-3 py-2">Player %</th>
                          <th className="px-3 py-2">Dataset avg %</th>
                          <th className="px-3 py-2">vs avg</th>
                          <th className="px-3 py-2">vs peers (σ)</th>
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
                            <td className="px-3 py-2">{row.category}</td>
                            <td className="px-3 py-2 font-mono">
                              {row.playerPct.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {row.datasetPct.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {row.vsAvgPp >= 0 ? "+" : ""}
                              {row.vsAvgPp.toFixed(1)} pp
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {row.vsPeersSigma >= 0 ? "+" : ""}
                              {row.vsPeersSigma.toFixed(2)}σ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === "bowling" && (
            <div className="space-y-6">
              {bowling.innings === 0 ? (
                <p className="text-sm text-slate-500">No bowling data for this filter.</p>
              ) : (
                <>
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Matches", bowling.matches],
                      ["Wickets", bowling.wickets],
                      ["Average", fmt(bowling.average)],
                      ["Economy", fmt(bowling.economy, 2)],
                      ["Strike rate", fmt(bowling.strikeRate)],
                      ["Best", bowling.bestFigures],
                      ["5W matches", bowling.fiveWicketMatches],
                      ["Maidens", bowling.maidens],
                    ].map(([label, val]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border border-surface-border bg-surface p-4"
                      >
                        <p className="text-xs uppercase text-slate-500">{label}</p>
                        <p className="mt-1 font-mono text-xl text-white">{val}</p>
                      </div>
                    ))}
                  </section>

                  {bowlingBySeason.length > 0 && (
                    <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
                      <h4 className="text-sm font-semibold text-white">Year by year</h4>
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-3 py-2">Season</th>
                              <th className="px-3 py-2">Mat</th>
                              <th className="px-3 py-2">Wkts</th>
                              <th className="px-3 py-2">Ave</th>
                              <th className="px-3 py-2">Econ</th>
                              <th className="px-3 py-2">SR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border text-slate-300">
                            {bowlingBySeason.map((row) => (
                              <tr key={row.season}>
                                <td className="px-3 py-2">{row.season}</td>
                                <td className="px-3 py-2 font-mono">{row.matches}</td>
                                <td className="px-3 py-2 font-mono">{row.wickets}</td>
                                <td className="px-3 py-2 font-mono">{fmt(row.average)}</td>
                                <td className="px-3 py-2 font-mono">{fmt(row.economy, 2)}</td>
                                <td className="px-3 py-2 font-mono">{fmt(row.strikeRate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "h2h" && (
            <section className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
              Head-to-head comparisons — coming soon.
            </section>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">
          Search and select a player to view batting, bowling, and dismissal stats.
        </p>
      )}
    </div>
  );
}
