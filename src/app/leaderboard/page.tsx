"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Trophy, Medal, Flame, Target, Calendar } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  totalKnown: number;
  totalForgot: number;
  totalDontKnow: number;
  totalCards: number;
  daysStudied: number;
  streak: number;
  score: number;
  accuracy: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/study-stats")
      .then((r) => r.json())
      .then((data) => { setLeaderboard(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function getMedalColor(index: number) {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-600";
    return "text-muted-foreground";
  }

  function getMedalIcon(index: number) {
    if (index < 3) return <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />;
    return <span className="text-sm text-muted-foreground w-5 text-center">{index + 1}</span>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">Top performers ranked by study score</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No one has studied yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, i) => {
            const isMe = user?.id === entry.user_id;
            return (
              <div
                key={entry.user_id}
                className={`p-4 rounded-xl border bg-card flex items-center gap-4 ${isMe ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex-shrink-0">{getMedalIcon(i)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{entry.username}</span>
                    {isMe && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {entry.accuracy}% accuracy</span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {entry.streak} day streak</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {entry.daysStudied} days</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold">{entry.score}</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
