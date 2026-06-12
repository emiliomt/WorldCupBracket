import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import MatchForm from "./MatchForm";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function MatchAdminPage({ params }: Props) {
  const matchId = parseInt(params.id);
  if (isNaN(matchId)) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      home: true,
      away: true,
      conduct: true,
    },
  });

  if (!match) notFound();

  const homeConduct = match.conduct.find((c) => c.teamId === match.homeTeamId) ?? null;
  const awayConduct = match.conduct.find((c) => c.teamId === match.awayTeamId) ?? null;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {match.home.name} vs {match.away.name}
      </h2>
      <MatchForm
        matchId={match.id}
        homeTeam={{ id: match.homeTeamId, name: match.home.name }}
        awayTeam={{ id: match.awayTeamId, name: match.away.name }}
        initialHomeScore={match.homeScore ?? undefined}
        initialAwayScore={match.awayScore ?? undefined}
        initialIsFinal={match.isFinal}
        homeConduct={homeConduct ?? undefined}
        awayConduct={awayConduct ?? undefined}
      />
    </div>
  );
}
