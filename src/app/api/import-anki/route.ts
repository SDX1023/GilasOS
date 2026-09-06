import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import initSqlJs from "sql.js";
import { readFileSync } from "fs";
import { join } from "path";
import { decompress } from "fzstd";

export const runtime = "nodejs";

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

async function getSQL() {
  if (!sqlPromise) {
    const wasmPath = join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
    const wasmBinary = readFileSync(wasmPath);
    sqlPromise = initSqlJs({ wasmBinary: wasmBinary.buffer });
  }
  return sqlPromise;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Debug: list all files in the ZIP
    const zipFiles: string[] = [];
    zip.forEach((path, entry) => {
      if (!entry.dir) zipFiles.push(path);
    });

    // Try multiple database files - .anki21b is zstd-compressed SQLite
    const dbCandidates = ["collection.anki21b", "collection.anki21", "collection.anki2"];
    let db: any = null;
    let dbUsed = "";
    const SQL = await getSQL();

    for (const name of dbCandidates) {
      const f = zip.file(name);
      if (!f) continue;
      try {
        let rawData: ArrayBuffer | Uint8Array = await f.async("arraybuffer");
        // .anki21b is zstandard-compressed SQLite
        if (name === "collection.anki21b") {
          rawData = decompress(new Uint8Array(rawData));
        }
        db = new SQL.Database(rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData));
        db.exec("SELECT 1");
        dbUsed = name;
        break;
      } catch {
        db = null;
        continue;
      }
    }

    if (!db) {
      return NextResponse.json({ error: "Could not read Anki database from file", debug: { zipFiles } }, { status: 400 });
    }

    const tables: string[] = [];
    const tRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tRes.length) tRes[0].values.forEach((r: any[]) => tables.push(r[0]));

    // Debug: count rows in key tables
    const debug: Record<string, any> = { tables, zipFiles, dbUsed };
    for (const t of ["cards", "notes", "col"]) {
      if (tables.includes(t)) {
        const cnt = db.exec(`SELECT COUNT(*) FROM "${t}"`);
        debug[`${t}_count`] = cnt.length ? cnt[0].values[0][0] : 0;
      }
    }

    // Use SQL JOIN to avoid JS number precision issues with large Anki IDs
    const deckCards = new Map<string, { front: string; back: string; hint?: string }[]>();

    // Try the direct JOIN approach first
    if (tables.includes("cards") && tables.includes("notes")) {
      // Try JOIN with CAST to handle type mismatches
      let joinResult = db.exec(`
        SELECT CAST(c.did AS TEXT), n.flds
        FROM cards c
        JOIN notes n ON CAST(c.nid AS TEXT) = CAST(n.id AS TEXT)
      `);
      if (!joinResult.length || !joinResult[0].values.length) {
        // Fallback: try without CAST
        joinResult = db.exec(`SELECT c.did, n.flds FROM cards c JOIN notes n ON c.nid = n.id`);
      }
      debug.join_rows = joinResult.length ? joinResult[0].values.length : 0;
      if (joinResult.length) {
        for (const row of joinResult[0].values) {
          const deckId = String(row[0]);
          const flds = row[1] as string;
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

    // Fallback: if no cards found via JOIN, try notes-only
    if (deckCards.size === 0 && tables.includes("notes")) {
      const noteResult = db.exec("SELECT flds FROM notes");
      if (noteResult.length) {
        const cards: { front: string; back: string; hint?: string }[] = [];
        for (const row of noteResult[0].values) {
          const flds = row[0] as string;
          const fields = flds.split("\x1f");
          const front = (fields[0] || "").replace(/<[^>]+>/g, "").trim();
          const back = (fields[1] || "").replace(/<[^>]+>/g, "").trim();
          const hint = fields.length > 2 ? fields.slice(2).join(" ").replace(/<[^>]+>/g, "").trim() : undefined;
          if (!front && !back) continue;
          cards.push({ front, back, hint: hint || undefined });
        }
        if (cards.length > 0) deckCards.set("0", cards);
      }
    }

    // Read deck names from col table
    const deckNames = new Map<string, string>();
    if (tables.includes("col")) {
      const colRows = db.exec("SELECT decks FROM col");
      if (colRows.length) {
        for (const row of colRows[0].values) {
          try {
            const decks = JSON.parse(row[0] as string);
            for (const [id, d] of Object.entries(decks)) {
              if (d && typeof d === "object" && "name" in (d as any)) {
                deckNames.set(String(id), (d as any).name);
              }
            }
          } catch {}
        }
      }
    }

    db.close();

    const result: { name: string; cards: { front: string; back: string; hint?: string }[] }[] = [];
    for (const [deckId, cards] of deckCards) {
      if (cards.length === 0) continue;
      result.push({ name: deckNames.get(deckId) || `Deck ${deckId}`, cards });
    }

    return NextResponse.json({ decks: result, debug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse Anki file" }, { status: 500 });
  }
}
