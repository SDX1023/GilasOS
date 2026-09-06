import JSZip from "jszip";
import initSqlJs, { Database } from "sql.js";

export interface ParsedAnkiDeck {
  name: string;
  cards: { front: string; back: string; hint?: string }[];
}

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

const WASM_URL = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/sql-wasm.wasm";
const WASM_CACHE_KEY = "sql-wasm-cache-v1";

async function loadWasmBinary(): Promise<ArrayBuffer> {
  // Check IndexedDB cache
  const cached = await new Promise<ArrayBuffer | null>((resolve) => {
    const req = indexedDB.open("anki-parser-db", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => {
      const tx = req.result.transaction("files", "readonly");
      const get = tx.objectStore("files").get(WASM_CACHE_KEY);
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });

  if (cached) return cached;

  // Download and cache
  const resp = await fetch(WASM_URL);
  const buf = await resp.arrayBuffer();

  const wreq = indexedDB.open("anki-parser-db", 1);
  wreq.onupgradeneeded = () => wreq.result.createObjectStore("files");
  wreq.onsuccess = () => {
    const tx = wreq.result.transaction("files", "readwrite");
    tx.objectStore("files").put(buf, WASM_CACHE_KEY);
  };

  return buf;
}

async function getSQL() {
  if (!sqlPromise) {
    const wasmBinary = await loadWasmBinary();
    sqlPromise = initSqlJs({ wasmBinary });
  }
  return sqlPromise;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function getTableNames(db: Database): string[] {
  const result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (!result.length) return [];
  return result[0].values.map((row: any[]) => row[0] as string);
}

function getColumnInfo(db: Database, table: string): string[] {
  const result = db.exec(`PRAGMA table_info("${table}")`);
  if (!result.length) return [];
  return result[0].values.map((row: any[]) => row[1] as string);
}

function safeQuery(db: Database, sql: string): any[][] {
  try {
    const result = db.exec(sql);
    if (!result.length) return [];
    return result[0].values;
  } catch {
    return [];
  }
}

async function parseAnkiDB(data: ArrayBuffer): Promise<ParsedAnkiDeck[]> {
  const SQL = await getSQL();
  const db = new SQL.Database(new Uint8Array(data));

  const tables = getTableNames(db);
  console.log("[Anki] Tables found:", tables);

  const colCols = tables.includes("col") ? getColumnInfo(db, "col") : [];
  const noteCols = tables.includes("notes") ? getColumnInfo(db, "notes") : [];
  const cardCols = tables.includes("cards") ? getColumnInfo(db, "cards") : [];

  console.log("[Anki] col columns:", colCols);
  console.log("[Anki] notes columns:", noteCols);
  console.log("[Anki] cards columns:", cardCols);

  // Read deck names from col table (decks field is JSON)
  const deckNames = new Map<number, string>();
  if (colCols.length) {
    const colRows = safeQuery(db, "SELECT * FROM col");
    for (const row of colRows) {
      const decksJsonIdx = colCols.indexOf("decks");
      if (decksJsonIdx >= 0 && row[decksJsonIdx]) {
        try {
          const decks = JSON.parse(row[decksJsonIdx] as string);
          for (const [id, deck] of Object.entries(decks)) {
            if (deck && typeof deck === "object" && "name" in (deck as any)) {
              deckNames.set(Number(id), (deck as any).name);
            }
          }
        } catch {}
      }
    }
  }

  // Read notes
  const notes = new Map<number, string>();
  if (noteCols.length) {
    const idIdx = noteCols.indexOf("id");
    const fldsIdx = noteCols.indexOf("flds");
    if (idIdx >= 0 && fldsIdx >= 0) {
      const noteRows = safeQuery(db, "SELECT id, flds FROM notes");
      for (const row of noteRows) {
        notes.set(row[idIdx] as number, row[fldsIdx] as string);
      }
    }
  }

  console.log("[Anki] Notes found:", notes.size);

  // Read cards and group by deck
  const deckCards = new Map<number, { front: string; back: string; hint?: string }[]>();

  if (cardCols.length) {
    const nidIdx = cardCols.indexOf("nid");
    const didIdx = cardCols.indexOf("did");
    if (nidIdx >= 0 && didIdx >= 0) {
      const cardRows = safeQuery(db, "SELECT nid, did FROM cards");
      for (const row of cardRows) {
        const noteId = row[nidIdx] as number;
        const deckId = row[didIdx] as number;
        const flds = notes.get(noteId);
        if (!flds) continue;

        const fields = flds.split("\x1f");
        const front = stripHtml(fields[0] || "");
        const back = stripHtml(fields[1] || "");
        const hint = fields.length > 2 ? stripHtml(fields.slice(2).join(" ")) : undefined;

        if (!front && !back) continue;

        if (!deckCards.has(deckId)) deckCards.set(deckId, []);
        deckCards.get(deckId)!.push({ front, back, hint: hint || undefined });
      }
    }
  }

  console.log("[Anki] Deck card counts:", Array.from(deckCards.entries()).map(([id, cards]) => `${deckNames.get(id) || id}: ${cards.length}`));

  // Build result
  const result: ParsedAnkiDeck[] = [];
  for (const [deckId, cards] of deckCards) {
    if (cards.length === 0) continue;
    result.push({
      name: deckNames.get(deckId) || `Deck ${deckId}`,
      cards,
    });
  }

  // If no cards table, try direct notes-to-decks approach
  if (result.length === 0 && noteCols.length) {
    console.log("[Anki] No cards found via cards table, trying direct notes approach");
    const noteRows = safeQuery(db, "SELECT * FROM notes");
    const fldsIdx = noteCols.indexOf("flds");
    const tagsIdx = noteCols.indexOf("tags");

    if (fldsIdx >= 0) {
      const cards: { front: string; back: string; hint?: string }[] = [];
      for (const row of noteRows) {
        const flds = row[fldsIdx] as string;
        const fields = flds.split("\x1f");
        const front = stripHtml(fields[0] || "");
        const back = stripHtml(fields[1] || "");
        const hint = fields.length > 2 ? stripHtml(fields.slice(2).join(" ")) : undefined;
        if (!front && !back) continue;
        cards.push({ front, back, hint: hint || undefined });
      }
      if (cards.length > 0) {
        result.push({ name: "Imported Deck", cards });
      }
    }
  }

  db.close();
  return result;
}

export async function preloadAnkiParser() {
  await getSQL();
}

export async function parseAnkiFile(file: File): Promise<ParsedAnkiDeck[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  console.log("[Anki] ZIP files:", Object.keys(zip.files));

  const dbFile = zip.file("collection.anki21") || zip.file("collection.anki2");
  if (!dbFile) {
    const files = Object.keys(zip.files);
    throw new Error(`Invalid Anki file — no database found. Files in archive: ${files.join(", ")}`);
  }

  const dbData = await dbFile.async("arraybuffer");
  return parseAnkiDB(dbData);
}
