/**
 * Seed the database with FIFA World Cup 2026 groups, teams, and match fixtures.
 * FIFA rankings are approximate as of early 2025 draw.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 48 teams across 12 groups (4 per group), A–L
// Format: [code, name, fifaRanking]
const groups: Record<string, [string, string, number][]> = {
  A: [
    ["USA", "United States", 11],
    ["PAN", "Panama", 43],
    ["TRI", "Trinidad & Tobago", 98],
    ["MOR", "Morocco", 14],
  ],
  B: [
    ["ARG", "Argentina", 1],
    ["CHI", "Chile", 34],
    ["PER", "Peru", 38],
    ["AUS", "Australia", 24],
  ],
  C: [
    ["GER", "Germany", 16],
    ["JAP", "Japan", 17],
    ["ESP", "Spain", 3],
    ["BAN", "Bangladesh", 185],
  ],
  D: [
    ["FRA", "France", 2],
    ["BEL", "Belgium", 5],
    ["CAM", "Cameroon", 52],
    ["KSA", "Saudi Arabia", 56],
  ],
  E: [
    ["BRA", "Brazil", 6],
    ["COL", "Colombia", 12],
    ["PAR", "Paraguay", 63],
    ["NGR", "Nigeria", 40],
  ],
  F: [
    ["ENG", "England", 4],
    ["MEX", "Mexico", 15],
    ["SEN", "Senegal", 20],
    ["GHA", "Ghana", 65],
  ],
  G: [
    ["POR", "Portugal", 7],
    ["URU", "Uruguay", 18],
    ["ECU", "Ecuador", 42],
    ["COR", "Costa Rica", 55],
  ],
  H: [
    ["NED", "Netherlands", 8],
    ["POL", "Poland", 26],
    ["EGY", "Egypt", 37],
    ["NZL", "New Zealand", 99],
  ],
  I: [
    ["ITA", "Italy", 9],
    ["CRO", "Croatia", 10],
    ["ALB", "Albania", 66],
    ["CAD", "Canada", 47],
  ],
  J: [
    ["SUI", "Switzerland", 13],
    ["DEN", "Denmark", 19],
    ["GRK", "Greece", 49],
    ["SLO", "Slovenia", 57],
  ],
  K: [
    ["MOR2", "Morocco (K)", 14],
    ["SEN2", "Senegal (K)", 20],
    ["RSA", "South Africa", 68],
    ["KEN", "Kenya", 103],
  ],
  L: [
    ["KOR", "South Korea", 23],
    ["IRN", "Iran", 22],
    ["IRQ", "Iraq", 64],
    ["PHI", "Philippines", 135],
  ],
};

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.teamConduct.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.group.deleteMany();

  for (const [groupId, teamData] of Object.entries(groups)) {
    await prisma.group.create({ data: { id: groupId, name: `Group ${groupId}` } });

    const teams = await Promise.all(
      teamData.map(([code, name, fifaRanking]) =>
        prisma.team.create({ data: { code, name, fifaRanking, groupId } })
      )
    );

    // Create 6 round-robin matches per group (each pair plays once)
    const pairs: [number, number][] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push([teams[i].id, teams[j].id]);
      }
    }

    for (const [homeId, awayId] of pairs) {
      await prisma.match.create({
        data: { groupId, homeTeamId: homeId, awayTeamId: awayId },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
