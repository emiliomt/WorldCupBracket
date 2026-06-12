import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const groups = await prisma.group.findMany({ orderBy: { id: "asc" } });

  const matchesByGroup = await Promise.all(
    groups.map(async (g) => ({
      group: g,
      matches: await prisma.match.findMany({
        where: { groupId: g.id },
        include: { home: true, away: true, conduct: true },
        orderBy: { id: "asc" },
      }),
    }))
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Admin — Enter Results</h2>
      <p className="text-gray-400 text-sm mb-8">
        Click a match to enter the score and disciplinary cards.
      </p>

      <div className="space-y-10">
        {matchesByGroup.map(({ group, matches }) => (
          <div key={group.id}>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Group {group.id}</h3>
            <div className="space-y-2">
              {matches.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/match/${m.id}`}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-blue-600 transition-colors"
                >
                  <span className="font-medium w-36 text-right">{m.home.name}</span>
                  <span className="mx-4 text-gray-400 text-sm">
                    {m.isFinal
                      ? `${m.homeScore} – ${m.awayScore}`
                      : "vs"}
                  </span>
                  <span className="font-medium w-36">{m.away.name}</span>
                  <span className="ml-auto text-xs">
                    {m.isFinal ? (
                      <span className="bg-green-700 text-white px-2 py-0.5 rounded-full">Final</span>
                    ) : (
                      <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
