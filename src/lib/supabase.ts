import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that returns empty results when no Supabase is configured
    // This allows the app to build and run without Supabase
    return {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: { message: "No Supabase configured" } }),
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: "No Supabase configured" } }),
            }),
          }),
          single: () => Promise.resolve({ data: null, error: { message: "No Supabase configured" } }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "No Supabase configured" } }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: "No Supabase configured" } }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        upsert: () => Promise.resolve({ data: null, error: { message: "No Supabase configured" } }),
      }),
    } as unknown as SupabaseClient;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Lazy export for convenience
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});
