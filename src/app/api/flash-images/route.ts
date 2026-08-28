import { readdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  const base = join(process.cwd(), "public", "flash");
  const result: Record<string, string[]> = {};

  for (const folder of ["forgot", "dontknow", "know"]) {
    try {
      const files = await readdir(join(base, folder));
      result[folder] = files
        .filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f))
        .map((f) => `/flash/${folder}/${f}`);
    } catch {
      result[folder] = [];
    }
  }

  return Response.json(result);
}
