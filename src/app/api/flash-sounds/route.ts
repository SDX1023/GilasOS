import { readdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  const base = join(process.cwd(), "public", "flash", "sounds");
  const result: Record<string, string[]> = {};

  for (const folder of ["forgot", "dontknow", "know"]) {
    try {
      const files = await readdir(join(base, folder));
      result[folder] = files
        .filter((f) => /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(f))
        .map((f) => `/flash/sounds/${folder}/${f}`);
    } catch {
      result[folder] = [];
    }
  }

  return Response.json(result);
}
