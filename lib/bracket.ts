/**
 * FIFA World Cup 2026 group-stage tiebreaker rules.
 * Source: FIFA World Cup 2026 Regulations, page 26.
 *
 * Criteria applied in strict order — stop as soon as all tied teams are separated:
 *   Step 1 — Head-to-head mini-table (points → GD → GS)
 *   Step 2 — Overall group record (GD → GS)
 *   Step 3 — Team conduct score
 *   Step 4 — FIFA ranking (lower number = higher ranked)
 *
 * No drawing of lots — FIFA ranking is always the final arbiter.
 */

export interface TeamStats {
  teamId: number;
  teamName: string;
  fifaRanking: number;

  // Overall group record (all matches)
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;

  // Head-to-head record (against current tied group only, populated during tiebreaking)
  h2hPoints: number;
  h2hGoalDifference: number;
  h2hGoalsFor: number;

  // Disciplinary (conduct score — higher/less negative is better)
  conductScore: number;
}

export interface MatchResult {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
}

export interface ConductRecord {
  teamId: number;
  yellowCards: number;
  indirectReds: number;
  directReds: number;
  yellowAndRedCombos: number;
}

/**
 * Compute the conduct (fair-play) score for a team across a set of conduct records.
 * Higher (less negative) score is better.
 *
 *   -1  per yellow card
 *   -3  per indirect red (second yellow)
 *   -4  per direct red
 *   -5  per yellow + direct red in same match
 */
export function computeConductScore(records: ConductRecord[]): number {
  return records.reduce((score, r) => {
    return (
      score -
      r.yellowCards * 1 -
      r.indirectReds * 3 -
      r.directReds * 4 -
      r.yellowAndRedCombos * 5
    );
  }, 0);
}

/**
 * Compute head-to-head stats for a subset of teams from a full match list.
 * Only matches where BOTH home and away team are in `teamIds` are counted.
 */
function computeH2HStats(
  teamIds: number[],
  results: MatchResult[]
): Map<number, { points: number; gd: number; gf: number }> {
  const idSet = new Set(teamIds);
  const stats = new Map<number, { points: number; gd: number; gf: number }>();
  for (const id of teamIds) {
    stats.set(id, { points: 0, gd: 0, gf: 0 });
  }

  for (const m of results) {
    if (!idSet.has(m.homeTeamId) || !idSet.has(m.awayTeamId)) continue;

    const home = stats.get(m.homeTeamId)!;
    const away = stats.get(m.awayTeamId)!;
    const diff = m.homeScore - m.awayScore;

    home.gf += m.homeScore;
    home.gd += diff;
    away.gf += m.awayScore;
    away.gd -= diff;

    if (m.homeScore > m.awayScore) {
      home.points += 3;
    } else if (m.homeScore === m.awayScore) {
      home.points += 1;
      away.points += 1;
    } else {
      away.points += 3;
    }
  }

  return stats;
}

/**
 * Compare two numbers for descending sort (higher first).
 * Returns negative if a > b (a sorts before b).
 */
function desc(a: number, b: number): number {
  return b - a;
}

/**
 * Sort a group of teams that are tied on points by the full FIFA 2026 tiebreaker sequence.
 *
 * When 3+ teams are tied, head-to-head criteria are applied simultaneously across
 * the mini-table of only those teams. If h2h splits the group partially, the process
 * recurses for the remaining sub-tied cluster.
 *
 * @param tied    Teams that are all tied on overall points (must have ≥ 2 entries)
 * @param results Full list of final match results for the group
 * @returns       Teams sorted from best (1st) to worst in tiebreaker order
 */
export function breakTie(
  tied: TeamStats[],
  results: MatchResult[]
): TeamStats[] {
  if (tied.length === 1) return tied;

  // --- Step 1: Head-to-head among the tied teams ---
  const teamIds = tied.map((t) => t.teamId);
  const h2h = computeH2HStats(teamIds, results);

  // Attach h2h fields
  const withH2H = tied.map((t) => {
    const s = h2h.get(t.teamId)!;
    return { ...t, h2hPoints: s.points, h2hGoalDifference: s.gd, h2hGoalsFor: s.gf };
  });

  // Sort by h2h points → h2h GD → h2h GS
  const afterH2H = [...withH2H].sort((a, b) => {
    const byPts = desc(a.h2hPoints, b.h2hPoints);
    if (byPts !== 0) return byPts;
    const byGD = desc(a.h2hGoalDifference, b.h2hGoalDifference);
    if (byGD !== 0) return byGD;
    return desc(a.h2hGoalsFor, b.h2hGoalsFor);
  });

  // Partition into fully-separated teams and still-tied clusters
  return resolveGroups(afterH2H, results, compareH2H, compareOverall);
}

/** Comparator: h2h criteria only */
function compareH2H(a: TeamStats, b: TeamStats): number {
  const byPts = desc(a.h2hPoints, b.h2hPoints);
  if (byPts !== 0) return byPts;
  const byGD = desc(a.h2hGoalDifference, b.h2hGoalDifference);
  if (byGD !== 0) return byGD;
  return desc(a.h2hGoalsFor, b.h2hGoalsFor);
}

/** Comparator: overall + conduct + FIFA ranking (Steps 2–4) */
function compareOverall(a: TeamStats, b: TeamStats): number {
  const byGD = desc(a.goalDifference, b.goalDifference);
  if (byGD !== 0) return byGD;
  const byGF = desc(a.goalsFor, b.goalsFor);
  if (byGF !== 0) return byGF;
  const byConduct = desc(a.conductScore, b.conductScore);
  if (byConduct !== 0) return byConduct;
  return a.fifaRanking - b.fifaRanking; // lower number = better ranked
}

/**
 * Given a list already sorted by h2h, identify tied sub-clusters and resolve each:
 *   - If the sub-cluster is fully split by h2h → keep that order.
 *   - If a sub-cluster of 2+ remain tied after h2h → apply overall criteria.
 *   - If still tied after overall → FIFA ranking (already included in compareOverall).
 *
 * For a 2-team h2h tie the spec says move directly to overall (Step 2),
 * i.e., no recursive h2h loop — that only applies when 3+ teams form a new cluster.
 * For 3+ teams that are still tied after h2h, we recurse with overall comparator.
 */
function resolveGroups(
  sorted: TeamStats[],
  results: MatchResult[],
  primaryCmp: (a: TeamStats, b: TeamStats) => number,
  fallbackCmp: (a: TeamStats, b: TeamStats) => number
): TeamStats[] {
  const output: TeamStats[] = [];
  let i = 0;

  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && primaryCmp(sorted[i], sorted[j]) === 0) j++;

    const cluster = sorted.slice(i, j);

    if (cluster.length === 1) {
      output.push(cluster[0]);
    } else {
      // Try fallback (overall) criteria
      const afterFallback = [...cluster].sort(fallbackCmp);

      // Check if fallback resolved everything; if 3+ teams remain tied, no further
      // splitting is possible (FIFA ranking is always the final step — no lots).
      // Partition again in case fallback partially resolves.
      let fi = 0;
      while (fi < afterFallback.length) {
        let fj = fi + 1;
        while (fj < afterFallback.length && fallbackCmp(afterFallback[fi], afterFallback[fj]) === 0) fj++;
        const sub = afterFallback.slice(fi, fj);
        // All sub-tied teams are placed in FIFA ranking order (already sorted);
        // if ranking is identical they remain in arbitrary order — no lots.
        output.push(...sub);
        fi = fj;
      }
    }

    i = j;
  }

  return output;
}

/**
 * Rank all four teams in a group by their final group-stage standing.
 *
 * @param teams   All four teams with their full stats
 * @param results All final match results for this group
 * @returns       Teams sorted 1st–4th
 */
export function rankGroup(teams: TeamStats[], results: MatchResult[]): TeamStats[] {
  // Primary sort: overall points descending
  const byPoints = [...teams].sort((a, b) => desc(a.points, b.points));

  // Partition into tied clusters and resolve each
  const output: TeamStats[] = [];
  let i = 0;

  while (i < byPoints.length) {
    let j = i + 1;
    while (j < byPoints.length && byPoints[i].points === byPoints[j].points) j++;

    const cluster = byPoints.slice(i, j);
    if (cluster.length === 1) {
      output.push(cluster[0]);
    } else {
      output.push(...breakTie(cluster, results));
    }

    i = j;
  }

  return output;
}

/**
 * Rank the 12 third-place teams across all groups to find the 8 best.
 * Head-to-head does NOT apply here (teams come from different groups).
 *
 * Criteria in order:
 *   1) Points
 *   2) Goal difference
 *   3) Goals scored
 *   4) Team conduct score
 *   5) FIFA ranking
 */
export function rankThirdPlace(thirds: TeamStats[]): TeamStats[] {
  return [...thirds].sort((a, b) => {
    const byPts = desc(a.points, b.points);
    if (byPts !== 0) return byPts;
    const byGD = desc(a.goalDifference, b.goalDifference);
    if (byGD !== 0) return byGD;
    const byGF = desc(a.goalsFor, b.goalsFor);
    if (byGF !== 0) return byGF;
    const byConduct = desc(a.conductScore, b.conductScore);
    if (byConduct !== 0) return byConduct;
    return a.fifaRanking - b.fifaRanking;
  });
}
