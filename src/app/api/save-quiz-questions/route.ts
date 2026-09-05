import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { quizId, userId, questions, accessToken } = await req.json();
    if (!quizId || !userId || !Array.isArray(questions) || !accessToken) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const serialized = JSON.parse(JSON.stringify(questions));

    const { error } = await supabase
      .from("saved_quizzes")
      .update({ questions: serialized, total_questions: questions.length })
      .eq("id", quizId)
      .eq("user_id", userId);

    if (error) {
      console.error("API quiz update failed:", error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
