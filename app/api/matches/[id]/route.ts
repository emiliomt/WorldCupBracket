import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ConductPayload {
  teamId: number;
  yellowCards: number;
  indirectReds: number;
  directReds: number;
  yellowAndRedCombos: number;
}

interface PatchBody {
  homeScore: number;
  awayScore: number;
  isFinal: boolean;
  homeConduct: ConductPayload;
  awayConduct: ConductPayload;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = parseInt(params.id);
  if (isNaN(matchId)) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { homeScore, awayScore, isFinal, homeConduct, awayConduct } = body;

  if (
    typeof homeScore !== "number" ||
    typeof awayScore !== "number" ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { homeScore, awayScore, isFinal },
      });

      for (const conduct of [homeConduct, awayConduct]) {
        await tx.teamConduct.upsert({
          where: { matchId_teamId: { matchId, teamId: conduct.teamId } },
          create: {
            matchId,
            teamId: conduct.teamId,
            yellowCards: conduct.yellowCards,
            indirectReds: conduct.indirectReds,
            directReds: conduct.directReds,
            yellowAndRedCombos: conduct.yellowAndRedCombos,
          },
          update: {
            yellowCards: conduct.yellowCards,
            indirectReds: conduct.indirectReds,
            directReds: conduct.directReds,
            yellowAndRedCombos: conduct.yellowAndRedCombos,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
