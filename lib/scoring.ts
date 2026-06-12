/**
 * scoring.ts — compute live group standings from the database.
 *
 * This module reads all final match results and conduct records for a group,
 * builds TeamStats objects, and runs them through the tiebreaker in bracket.ts.
 */

import { PrismaClient } from "@prisma/client";
import {
  TeamStats,
  MatchResult,
  computeConductScore,
  rankGroup,
  rankThirdPlace,
} from "./bracket";

const prisma = new PrismaClient();

/** Fetch all teams and matches for a group and compute ranked standings. */
export async function getGroupStandings(groupId: string): Promise<TeamStats[]> {
  const teams = await prisma.team.findMany({
    where: { groupId },
    include: {
      conduct: { include: { match: true } },
    },
  });

  const matches = await prisma.match.findMany({
    where: { groupId, isFinal: true },
  });

  const results: MatchResult[] = matches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .map((m) => ({
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore!,
      awayScore: m.awayScore!,
    }));

  const statsMap = new Map<number, TeamStats>();

  for (const team of teams) {
    const conductScore = computeConductScore(
      team.conduct.map((c) => ({
        teamId: c.teamId,
        yellowCards: c.yellowCards,
        indirectReds: c.indirectReds,
        directReds: c.directReds,
        yellowAndRedCombos: c.yellowAndRedCombos,
      }))
    );

    statsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      fifaRanking: team.fifaRanking,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      h2hPoints: 0,
      h2hGoalDifference: 0,
      h2hGoalsFor: 0,
      conductScore,
    });
  }

  for (const r of results) {
    const home = statsMap.get(r.homeTeamId);
    const away = statsMap.get(r.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += r.homeScore;
    home.goalsAgainst += r.awayScore;
    away.goalsFor += r.awayScore;
    away.goalsAgainst += r.homeScore;

    if (r.homeScore > r.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (r.homeScore === r.awayScore) {
      home.drawn++;
      home.points += 1;
      away.drawn++;
      away.points += 1;
    } else {
      away.won++;
      away.points += 3;
      home.lost++;
    }
  }

  for (const s of statsMap.values()) {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  }

  return rankGroup(Array.from(statsMap.values()), results);
}

/** Fetch the best-8 third-place teams from all groups. */
export async function getBestThirdPlaceTeams(): Promise<TeamStats[]> {
  const groups = await prisma.group.findMany({ select: { id: true } });

  const allThirds: TeamStats[] = [];
  for (const g of groups) {
    const standings = await getGroupStandings(g.id);
    if (standings.length >= 3) {
      allThirds.push(standings[2]); // index 2 = third place
    }
  }

  return rankThirdPlace(allThirds).slice(0, 8);
}
