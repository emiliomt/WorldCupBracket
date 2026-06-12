import { getBestThirdPlaceTeams } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function ThirdPlacePage() {
  const teams = await getBestThirdPlaceTeams();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Best Third-Place Teams</h2>
      <p className="text-gray-400 text-sm mb-6">
        Top 8 of 12 third-place teams advance. Ranked by: points → goal difference
        → goals scored → conduct score → FIFA ranking. Head-to-head does not apply
        across groups.
      </p>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-center">Pts</th>
              <th className="px-4 py-3 text-center">GD</th>
              <th className="px-4 py-3 text-center">GF</th>
              <th className="px-4 py-3 text-center">Conduct</th>
              <th className="px-4 py-3 text-center">FIFA Rank</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, idx) => (
              <tr key={t.teamId} className={`border-t border-gray-800 ${idx < 8 ? "bg-green-950/30" : ""}`}>
                <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                <td className="px-4 py-3 font-medium">{t.teamName}</td>
                <td className="px-4 py-3 text-center font-bold">{t.points}</td>
                <td className="px-4 py-3 text-center">{t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}</td>
                <td className="px-4 py-3 text-center">{t.goalsFor}</td>
                <td className="px-4 py-3 text-center">{t.conductScore}</td>
                <td className="px-4 py-3 text-center">{t.fifaRanking}</td>
                <td className="px-4 py-3 text-center">
                  {idx < 8 ? (
                    <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">Advance</span>
                  ) : (
                    <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded-full">Eliminated</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
