import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = `%${q}%`;
  const supabase = getSupabase();

  const [coursesRes, modulesRes, notesRes, contentRes, decksRes, sharedRes, archiveRes] = await Promise.all([
    supabase.from("courses").select("id, title, description").ilike("title", query).limit(5),
    supabase.from("modules").select("id, title, description, course_id").ilike("title", query).limit(5),
    supabase.from("notes").select("id, title, slug, course_id, module_id").ilike("title", query).limit(5),
    supabase.from("module_content").select("id, title, course_id, module_id").ilike("title", query).limit(5),
    supabase.from("custom_decks").select("id, title, description").or(`title.ilike.${query},description.ilike.${query}`).limit(5),
    supabase.from("shared_decks").select("id, title, description").or(`title.ilike.${query},description.ilike.${query}`).limit(5),
    supabase.from("archive_entries").select("id, competition, type, year").or(`competition.ilike.${query},type.ilike.${query}`).limit(5),
  ]);

  const results: any[] = [];

  (coursesRes.data || []).forEach((c: any) => {
    results.push({ type: "subject", id: c.id, title: c.title, subtitle: c.description || "", href: `/subjects/${c.id}` });
  });

  (modulesRes.data || []).forEach((m: any) => {
    results.push({ type: "module", id: m.id, title: m.title, subtitle: m.description || "", href: `/subjects/${m.course_id}/${m.id}` });
  });

  (notesRes.data || []).forEach((n: any) => {
    results.push({ type: "note", id: n.id, title: n.title, subtitle: "Note", href: `/subjects/${n.course_id}/${n.module_id}/content/${n.id}` });
  });

  (contentRes.data || []).forEach((c: any) => {
    results.push({ type: "content", id: c.id, title: c.title, subtitle: "Content", href: `/subjects/${c.course_id}/${c.module_id}/content/${c.id}` });
  });

  (decksRes.data || []).forEach((d: any) => {
    results.push({ type: "deck", id: d.id, title: d.title, subtitle: d.description || "Custom Deck", href: `/decks/${d.id}` });
  });

  (sharedRes.data || []).forEach((s: any) => {
    results.push({ type: "shared", id: s.id, title: s.title, subtitle: s.description || "Shared Deck", href: `/shared/${s.id}` });
  });

  (archiveRes.data || []).forEach((a: any) => {
    results.push({ type: "archive", id: a.id, title: a.competition, subtitle: `${a.type} · ${a.year}`, href: "/archive" });
  });

  return NextResponse.json({ results });
}
