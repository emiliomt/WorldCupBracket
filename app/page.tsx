import { PrismaClient } from "@prisma/client";
import { getGroupStandings } from "@/lib/scoring";
import StandingsTable from "@/components/StandingsTable";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const groups = await prisma.group.findMany({ orderBy: { id: "asc" } });

  const standings = await Promise.all(
    groups.map(async (g) => ({
      group: g,
      teams: await getGroupStandings(g.id),
    }))
  );

  if (standings.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-20">
        <p className="text-2xl font-semibold mb-2">No groups yet</p>
        <p>Run the database seed to populate groups and teams.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {standings.map(({ group, teams }) => (
        <div key={group.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="bg-blue-700 px-4 py-3">
            <h2 className="font-bold text-lg tracking-wide">Group {group.id}</h2>
          </div>
          <StandingsTable teams={teams} />
        </div>
      ))}
    </div>
  );
}
