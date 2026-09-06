import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import initSqlJs from "sql.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const dbFile = zip.file("collection.anki21") || zip.file("collection.anki2");
    if (!dbFile) {
      return NextResponse.json({ error: "Invalid Anki file — no database found" }, { status: 400 });
    }

    const dbData = await dbFile.async("arraybuffer");

    const SQL = await initSqlJs();
    const db = new SQL.Database(new Uint8Array(dbData));

    const tables: string[] = [];
    const tRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tRes.length) tRes[0].values.forEach((r: any[]) => tables.push(r[0]));

    const deckNames = new Map<number, string>();
    if (tables.includes("col")) {
      const cols: string[] = [];
      const cRes = db.exec("PRAGMA table_info(col)");
      if (cRes.length) cRes[0].values.forEach((r: any[]) => cols.push(r[1]));
      const decksIdx = cols.indexOf("decks");
      if (decksIdx >= 0) {
        const rows = db.exec("SELECT * FROM col");
        if (rows.length) {
          for (const row of rows[0].values) {
            try {
              const decks = JSON.parse(row[decksIdx] as string);
              for (const [id, d] of Object.entries(decks)) {
                if (d && typeof d === "object" && "name" in (d as any)) {
                  deckNames.set(Number(id), (d as any).name);
                }
              }
            } catch {}
          }
        }
      }
    }

    const notes = new Map<number, string>();
    if (tables.includes("notes")) {
      const noteRows = db.exec("SELECT id, flds FROM notes");
      if (noteRows.length) {
        for (const row of noteRows[0].values) {
          notes.set(row[0] as number, row[1] as string);
        }
      }
    }

    const deckCards = new Map<number, { front: string; back: string; hint?: string }[]>();
    if (tables.includes("cards")) {
      const cardRows = db.exec("SELECT nid, did FROM cards");
      if (cardRows.length) {
        for (const row of cardRows[0].values) {
          const noteId = row[0] as number;
          const deckId = row[1] as number;
          const flds = notes.get(noteId);
          if (!flds) continue;
          const fields = flds.split("\x1f");
          const front = (fields[0] || "").replace(/<[^>]+>/g, "").trim();
          const back = (fields[1] || "").replace(/<[^>]+>/g, "").trim();
          const hint = fields.length > 2 ? fields.slice(2).join(" ").replace(/<[^>]+>/g, "").trim() : undefined;
          if (!front && !back) continue;
          if (!deckCards.has(deckId)) deckCards.set(deckId, []);
          deckCards.get(deckId)!.push({ front, back, hint: hint || undefined });
        }
      }
    }

    if (deckCards.size === 0 && notes.size > 0) {
      const cards: { front: string; back: string; hint?: string }[] = [];
      for (const flds of notes.values()) {
        const fields = flds.split("\x1f");
        const front = (fields[0] || "").replace(/<[^>]+>/g, "").trim();
        const back = (fields[1] || "").replace(/<[^>]+>/g, "").trim();
        const hint = fields.length > 2 ? fields.slice(2).join(" ").replace(/<[^>]+>/g, "").trim() : undefined;
        if (!front && !back) continue;
        cards.push({ front, back, hint: hint || undefined });
      }
      if (cards.length > 0) deckCards.set(0, cards);
    }

    db.close();

    const result: { name: string; cards: { front: string; back: string; hint?: string }[] }[] = [];
    for (const [deckId, cards] of deckCards) {
      if (cards.length === 0) continue;
      result.push({ name: deckNames.get(deckId) || `Deck ${deckId}`, cards });
    }

    return NextResponse.json({ decks: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse Anki file" }, { status: 500 });
  }
}
