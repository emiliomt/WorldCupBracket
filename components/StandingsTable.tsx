"use client";

import { TeamStats } from "@/lib/bracket";

interface Props {
  teams: TeamStats[];
}

export default function StandingsTable({ teams }: Props) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
        <tr>
          <th className="px-3 py-2 text-left">#</th>
          <th className="px-3 py-2 text-left">Team</th>
          <th className="px-3 py-2 text-center">P</th>
          <th className="px-3 py-2 text-center">W</th>
          <th className="px-3 py-2 text-center">D</th>
          <th className="px-3 py-2 text-center">L</th>
          <th className="px-3 py-2 text-center">GD</th>
          <th className="px-3 py-2 text-center">GF</th>
          <th className="px-3 py-2 text-center">Pts</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((t, idx) => (
          <tr
            key={t.teamId}
            className={`border-t border-gray-800 ${idx < 2 ? "bg-green-950/30" : idx === 2 ? "bg-yellow-950/20" : ""}`}
          >
            <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
            <td className="px-3 py-2 font-medium">{t.teamName}</td>
            <td className="px-3 py-2 text-center text-gray-300">{t.played}</td>
            <td className="px-3 py-2 text-center text-gray-300">{t.won}</td>
            <td className="px-3 py-2 text-center text-gray-300">{t.drawn}</td>
            <td className="px-3 py-2 text-center text-gray-300">{t.lost}</td>
            <td className={`px-3 py-2 text-center font-medium ${t.goalDifference > 0 ? "text-green-400" : t.goalDifference < 0 ? "text-red-400" : "text-gray-300"}`}>
              {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}
            </td>
            <td className="px-3 py-2 text-center text-gray-300">{t.goalsFor}</td>
            <td className="px-3 py-2 text-center font-bold">{t.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
