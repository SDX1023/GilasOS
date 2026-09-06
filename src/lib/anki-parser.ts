import JSZip from "jszip";
import initSqlJs, { Database } from "sql.js";

export interface AnkiNote {
  id: number;
  guid: string;
  fields: string[];
  tags: string[];
}

export interface AnkiDeck {
  id: number;
  name: string;
  cardCount: number;
}

export interface ParsedAnkiDeck {
  name: string;
  cards: { front: string; back: string; hint?: string }[];
}

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

async function getSQL() {
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: () => "/sql-wasm-browser.wasm" });
  return sqlPromise;
}

function parseNoteFields(flds: string): string[] {
  return flds.split("\x1f");
}

function parseTags(tags: string): string[] {
  return tags.split(" ").filter(Boolean);
}

function readColName(colRow: any): string {
  if (!colRow) return "Unknown Deck";
  try {
    const col = JSON.parse(colRow.deconfs || colRow.decks || "{}");
    const deckId = Object.keys(col)[0];
    if (deckId && col[deckId]?.name) return col[deckId].name;
  } catch {}
  return "Unknown Deck";
}

async function parseAnkiDB(data: ArrayBuffer): Promise<ParsedAnkiDeck[]> {
  const SQL = await getSQL();
  const db = new SQL.Database(new Uint8Array(data));

  const decks = readDecks(db);
  const notes = readNotes(db);
  const cards = readCards(db);

  const deckMap = new Map<number, { front: string; back: string; hint?: string }[]>();

  for (const card of cards) {
    const note = notes.find((n) => n.id === card.noteId);
    if (!note) continue;

    const fields = parseNoteFields(note.flds);
    if (fields.length < 2) continue;

    const front = fields[0]?.replace(/<[^>]+>/g, "").trim() || "";
    const back = fields[1]?.replace(/<[^>]+>/g, "").trim() || "";
    const hint = fields.length > 2 ? fields.slice(2).join(" ").replace(/<[^>]+>/g, "").trim() : undefined;

    if (!front && !back) continue;

    if (!deckMap.has(card.deckId)) deckMap.set(card.deckId, []);
    deckMap.get(card.deckId)!.push({ front, back, hint: hint || undefined });
  }

  const result: ParsedAnkiDeck[] = [];
  for (const deck of decks) {
    const cards = deckMap.get(deck.id) || [];
    if (cards.length > 0) {
      result.push({ name: deck.name, cards });
    }
  }

  return result;
}

function readDecks(db: Database): AnkiDeck[] {
  try {
    const rows = db.exec("SELECT id, name FROM decks");
    if (!rows.length) return [];
    return rows[0].values.map((row: any[]) => ({
      id: row[0] as number,
      name: row[1] as string,
      cardCount: 0,
    }));
  } catch {
    return [];
  }
}

function readNotes(db: Database): { id: number; flds: string; tags: string }[] {
  try {
    const rows = db.exec("SELECT id, flds, tags FROM notes");
    if (!rows.length) return [];
    return rows[0].values.map((row: any[]) => ({
      id: row[0] as number,
      flds: row[1] as string,
      tags: row[2] as string,
    }));
  } catch {
    return [];
  }
}

function readCards(db: Database): { id: number; noteId: number; deckId: number }[] {
  try {
    const rows = db.exec("SELECT id, nid, did FROM cards");
    if (!rows.length) return [];
    return rows[0].values.map((row: any[]) => ({
      id: row[0] as number,
      noteId: row[1] as number,
      deckId: row[2] as number,
    }));
  } catch {
    return [];
  }
}

export async function parseAnkiFile(file: File): Promise<ParsedAnkiDeck[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const dbFile = zip.file("collection.anki21") || zip.file("collection.anki2");
  if (!dbFile) throw new Error("Invalid Anki file — no database found");

  const dbData = await dbFile.async("arraybuffer");
  return parseAnkiDB(dbData);
}
