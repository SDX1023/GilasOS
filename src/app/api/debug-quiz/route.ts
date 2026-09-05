import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { quizId, userId } = await req.json();

  if (!quizId || !userId) return NextResponse.json({ error: "missing quizId or userId" });

  // 1. Check what columns exist
  const { data: row, error: readErr } = await supabase
    .from("saved_quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("user_id", userId)
    .single();

  if (readErr) return NextResponse.json({ step: "read", error: readErr.message });

  const questionsType = typeof row.questions;
  const questionsIsArray = Array.isArray(row.questions);
  const questionsLen = questionsIsArray ? row.questions.length : -1;

  // 2. Try a simple update with a tiny test question
  const testQ = [{ type: "mc", question: "TEST", options: ["A", "B", "C", "D"], correct: 0 }];
  const { data: updateData, error: updateErr } = await supabase
    .from("saved_quizzes")
    .update({ questions: testQ })
    .eq("id", quizId)
    .eq("user_id", userId)
    .select("questions");

  if (updateErr) return NextResponse.json({
    step: "update",
    error: updateErr.message,
    details: updateErr.details,
    hint: updateErr.hint,
    code: updateErr.code,
    before: { questionsType, questionsIsArray, questionsLen },
  });

  // 3. Read back
  const { data: after } = await supabase
    .from("saved_quizzes")
    .select("questions")
    .eq("id", quizId)
    .single();

  const afterLen = Array.isArray(after?.questions) ? after!.questions.length : -1;
  const afterFirst = after?.questions?.[0];

  // 4. Restore original
  if (row.questions) {
    await supabase.from("saved_quizzes").update({ questions: row.questions }).eq("id", quizId);
  }

  return NextResponse.json({
    before: { questionsType, questionsIsArray, questionsLen },
    updateResult: updateData?.questions?.length,
    after: { len: afterLen, first: afterFirst },
    originalRestored: true,
  });
}
