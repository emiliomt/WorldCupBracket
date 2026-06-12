"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConductData {
  yellowCards: number;
  indirectReds: number;
  directReds: number;
  yellowAndRedCombos: number;
}

interface Props {
  matchId: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  initialHomeScore?: number;
  initialAwayScore?: number;
  initialIsFinal: boolean;
  homeConduct?: ConductData;
  awayConduct?: ConductData;
}

function conductDefaults(c?: ConductData): ConductData {
  return c ?? { yellowCards: 0, indirectReds: 0, directReds: 0, yellowAndRedCombos: 0 };
}

function ConductFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ConductData;
  onChange: (v: ConductData) => void;
}) {
  const field = (key: keyof ConductData, display: string) => (
    <div className="flex items-center gap-3">
      <label className="text-gray-400 text-sm w-48">{display}</label>
      <input
        type="number"
        min={0}
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: Math.max(0, parseInt(e.target.value) || 0) })}
        className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-center"
      />
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
      <h4 className="font-semibold mb-3 text-blue-300">{label}</h4>
      {field("yellowCards", "Yellow cards")}
      {field("indirectReds", "Indirect reds (2nd yellow)")}
      {field("directReds", "Direct reds")}
      {field("yellowAndRedCombos", "Yellow + direct red (same match)")}
    </div>
  );
}

export default function MatchForm({
  matchId,
  homeTeam,
  awayTeam,
  initialHomeScore,
  initialAwayScore,
  initialIsFinal,
  homeConduct: initHome,
  awayConduct: initAway,
}: Props) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState<string>(
    initialHomeScore !== undefined ? String(initialHomeScore) : ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    initialAwayScore !== undefined ? String(initialAwayScore) : ""
  );
  const [isFinal, setIsFinal] = useState(initialIsFinal);
  const [homeConduct, setHomeConduct] = useState<ConductData>(conductDefaults(initHome));
  const [awayConduct, setAwayConduct] = useState<ConductData>(conductDefaults(initAway));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);

    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setError("Please enter valid non-negative scores.");
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: hs,
        awayScore: as_,
        isFinal,
        homeConduct: { teamId: homeTeam.id, ...homeConduct },
        awayConduct: { teamId: awayTeam.id, ...awayConduct },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
    } else {
      router.push("/admin");
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Score */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="font-semibold mb-4">Score</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-sm text-gray-400 mb-1">{homeTeam.name}</p>
            <input
              type="number"
              min={0}
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center text-2xl font-bold"
            />
          </div>
          <span className="text-gray-500 text-2xl font-light">–</span>
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{awayTeam.name}</p>
            <input
              type="number"
              min={0}
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center text-2xl font-bold"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            id="isFinal"
            type="checkbox"
            checked={isFinal}
            onChange={(e) => setIsFinal(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isFinal" className="text-sm text-gray-300">
            Mark as final (counts towards standings)
          </label>
        </div>
      </div>

      {/* Disciplinary */}
      <div className="space-y-4">
        <h3 className="font-semibold">Disciplinary Cards</h3>
        <ConductFields label={homeTeam.name} value={homeConduct} onChange={setHomeConduct} />
        <ConductFields label={awayTeam.name} value={awayConduct} onChange={setAwayConduct} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save Result"}
        </button>
        <a
          href="/admin"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
