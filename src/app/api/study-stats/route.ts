import { getSupabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();
  const { user_id, known, forgot, dont_know, cards_total } = body;

  if (!user_id) {
    return Response.json({ error: "user_id required" }, { status: 400 });
  }

  const today = new Date().toDateString();

  const { data: existing } = await supabase
    .from("study_stats")
    .select("id, known, forgot, dont_know, cards_total")
    .eq("user_id", user_id)
    .eq("date", today)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("study_stats")
      .update({
        known: existing.known + known,
        forgot: existing.forgot + forgot,
        dont_know: existing.dont_know + dont_know,
        cards_total: existing.cards_total + cards_total,
      })
      .eq("id", existing.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("study_stats")
      .insert({ user_id, date: today, known, forgot, dont_know, cards_total });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function GET() {
  const supabase = getSupabase();

  const { data: stats, error } = await supabase
    .from("study_stats")
    .select("user_id, known, forgot, dont_know, cards_total, date")
    .order("date", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: profiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, username");

  const profileMap: Record<string, string> = {};
  if (profiles) {
    profiles.forEach((p) => { profileMap[p.user_id] = p.username; });
  }

  const userStats: Record<string, {
    username: string;
    totalKnown: number;
    totalForgot: number;
    totalDontKnow: number;
    totalCards: number;
    daysStudied: number;
    streak: number;
    lastDate: string;
  }> = {};

  if (stats) {
    for (const s of stats) {
      if (!userStats[s.user_id]) {
        userStats[s.user_id] = {
          username: profileMap[s.user_id] || "Unknown",
          totalKnown: 0,
          totalForgot: 0,
          totalDontKnow: 0,
          totalCards: 0,
          daysStudied: 0,
          streak: 0,
          lastDate: "",
        };
      }
      const u = userStats[s.user_id];
      u.totalKnown += s.known;
      u.totalForgot += s.forgot;
      u.totalDontKnow += s.dont_know;
      u.totalCards += s.cards_total;
      u.daysStudied++;
      if (!u.lastDate || s.date > u.lastDate) u.lastDate = s.date;
    }
  }

  const today = new Date();
  for (const uid of Object.keys(userStats)) {
    const u = userStats[uid];
    let streak = 0;
    let checkDate = new Date(today);
    const dates = stats
      ?.filter((s) => s.user_id === uid)
      .map((s) => s.date) || [];
    while (true) {
      const dateStr = checkDate.toDateString();
      if (dates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    u.streak = streak;
  }

  const leaderboard = Object.entries(userStats)
    .map(([user_id, stats]) => ({
      user_id,
      ...stats,
      score: stats.totalKnown * 10 + stats.streak * 50 + stats.daysStudied * 5,
      accuracy: stats.totalCards > 0 ? Math.round((stats.totalKnown / stats.totalCards) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  return Response.json(leaderboard);
}
