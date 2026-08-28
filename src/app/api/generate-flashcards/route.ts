import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 80000;
const CHUNK_SIZE = 8000; // Reduced from 12000 to be more conservative
const DELAY_BETWEEN_CHUNKS = 3000; // 3 seconds between chunks
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

// Track rate limit state
let lastRequestTime = 0;
const MIN_INTERVAL = 2000; // Minimum 2 seconds between ANY requests

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_INTERVAL) {
    await sleep(MIN_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

async function safeJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Smart chunking - try to keep chunks smaller and more focused
function splitIntoChunks(text: string, size: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    
    if (end < text.length) {
      // Try to break at paragraph boundaries
      const lastBreak = text.lastIndexOf("\n\n", end);
      if (lastBreak > start + size * 0.3) {
        end = lastBreak;
      } else {
        // Try to break at sentence boundaries
        const lastPeriod = text.lastIndexOf(". ", end);
        const lastQuestion = text.lastIndexOf("? ", end);
        const lastExclamation = text.lastIndexOf("! ", end);
        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
        if (lastSentenceEnd > start + size * 0.3) {
          end = lastSentenceEnd + 2; // Include the punctuation and space
        }
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    start = end;
  }
  
  return chunks;
}

// Clean the text to remove unnecessary content
function cleanText(text: string): string {
  return text
    // Remove page numbers
    .replace(/===== Page \d+ =====/g, '')
    // Remove image markers
    .replace(/image\[\[\d+,\s*\d+,\s*\d+,\s*\d+\]\]/g, '')
    // Remove box/ref markers
    .replace(/<\|box_start\|>\d+<\|box_end\|>/g, '')
    .replace(/<\|ref_start\|>.*?<\|ref_end\|>/g, '')
    .replace(/<\|md_start\|>.*?<\|md_end\|>/g, '')
    // Remove center tags
    .replace(/<center>.*?<\/center>/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPrompt(chunkText: string, chunkIndex: number, totalChunks: number): string {
  const contextNote = totalChunks > 1
    ? `This is section ${chunkIndex + 1} of ${totalChunks}.`
    : "";

  return `Generate flashcards from this study material.

${contextNote}

Rules:
- Create 8-15 flashcards from this content
- Each flashcard: one question (front) and one answer (back)
- Focus on key facts, definitions, names, dates, and concepts
- Don't include trivial or duplicate information
- Return ONLY a valid JSON array: [{"front": "question?", "back": "answer"}]

Content:
${chunkText}`;
}

async function generateForChunk(
  apiKey: string,
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  attempt: number = 0
): Promise<{ cards: any[]; error?: string }> {
  // Ensure we respect rate limits before making the request
  await waitForRateLimit();
  
  const prompt = buildPrompt(chunkText, chunkIndex, totalChunks);
  
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent results
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const body = await safeJson(res);

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(body?.error?.message || "");
      const waitTime = Math.max(retryAfter, 30 + attempt * 15);
      console.log(`⏳ Rate limited on chunk ${chunkIndex + 1}. Waiting ${waitTime}s...`);
      
      if (attempt < MAX_RETRIES) {
        await sleep(waitTime * 1000);
        // Reset lastRequestTime to avoid immediate retry
        lastRequestTime = 0;
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: `Rate limited after ${MAX_RETRIES} retries` };
    }

    if (!res.ok) {
      const errorMsg = body?.error?.message || `API error (${res.status})`;
      console.error(`❌ Chunk ${chunkIndex + 1} error:`, errorMsg);
      
      if (attempt < MAX_RETRIES) {
        const waitTime = BASE_DELAY * Math.pow(2, attempt);
        await sleep(waitTime);
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: errorMsg };
    }

    const candidate = body?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? "";

    // Try multiple parsing strategies
    let cards: any[] = [];
    
    // Strategy 1: Find JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cards = parsed;
        }
      } catch (e) {
        console.log(`⚠️ JSON parse failed for chunk ${chunkIndex + 1}, trying alternative...`);
      }
    }

    // Strategy 2: Try to parse the entire response
    if (cards.length === 0) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cards = parsed;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Strategy 3: Look for Q&A pairs in the text
    if (cards.length === 0) {
      const qaPairs = content.match(/"front"\s*:\s*"([^"]*?)"\s*,\s*"back"\s*:\s*"([^"]*?)"/g);
      if (qaPairs) {
        cards = qaPairs.map((pair: string) => {
          const frontMatch = pair.match(/"front"\s*:\s*"([^"]*?)"/);
          const backMatch = pair.match(/"back"\s*:\s*"([^"]*?)"/);
          return {
            front: frontMatch ? frontMatch[1] : '',
            back: backMatch ? backMatch[1] : ''
          };
        }).filter((card: { front: string; back: string }) => card.front && card.back);
      }
    }

    if (cards.length === 0) {
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: `No valid flashcards generated from chunk ${chunkIndex + 1}` };
    }

    console.log(`✅ Chunk ${chunkIndex + 1} generated ${cards.length} cards`);
    return { cards };

  } catch (error: any) {
    console.error(`💥 Chunk ${chunkIndex + 1} error:`, error.message);
    
    if (attempt < MAX_RETRIES) {
      const waitTime = BASE_DELAY * Math.pow(2, attempt);
      await sleep(waitTime);
      return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
    }
    return { cards: [], error: error?.message || `Chunk ${chunkIndex + 1} failed` };
  }
}

function dedupeCards(cards: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const card of cards) {
    const front = String(card.front || "").trim().toLowerCase();
    const back = String(card.back || "").trim().toLowerCase();
    const key = `${front}|${back}`;
    if (front && !seen.has(key)) {
      seen.add(key);
      result.push(card);
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    let text: string;
    try {
      const body = await req.json();
      text = body.text;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Clean the text first
    const cleanedText = cleanText(text);
    const truncatedText = cleanedText.slice(0, MAX_CHARS);
    
    // Check cache
    const key = `fc-${simpleHash(truncatedText)}-v9`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      console.log(`📦 Cache hit for ${key}`);
      return NextResponse.json({ cards: cached.data });
    }

    // Split into smaller chunks
    const chunks = splitIntoChunks(truncatedText, CHUNK_SIZE);
    console.log(`📝 Processing ${chunks.length} chunks (avg ${Math.round(truncatedText.length / chunks.length)} chars each)`);

    let allCards: any[] = [];
    const errors: string[] = [];

    // Process chunks sequentially with longer delays
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
      
      const { cards, error } = await generateForChunk(
        apiKey,
        chunks[i],
        i,
        chunks.length
      );
      
      if (error) {
        errors.push(error);
        console.error(`❌ Chunk ${i + 1} error:`, error);
      }
      
      if (cards.length > 0) {
        allCards = allCards.concat(cards);
        console.log(`📊 Chunk ${i + 1}: ${cards.length} cards generated`);
      }

      // Longer delay between chunks
      if (i < chunks.length - 1) {
        const delay = DELAY_BETWEEN_CHUNKS + (i * 500); // Increase delay for later chunks
        console.log(`⏳ Waiting ${delay}ms before next chunk...`);
        await sleep(delay);
      }
    }

    allCards = dedupeCards(allCards);
    console.log(`🎯 Total unique cards: ${allCards.length}`);

    if (allCards.length === 0) {
      return NextResponse.json(
        { error: errors[0] || "Failed to generate any flashcards" },
        { status: 500 }
      );
    }

    // Cache results
    cache.set(key, { data: allCards, ts: Date.now() });

    return NextResponse.json({
      cards: allCards,
      totalCards: allCards.length,
      chunksProcessed: chunks.length,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });

  } catch (err: any) {
    console.error("💥 Unhandled error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}