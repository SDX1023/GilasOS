// lib/custom-content.ts

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create supabase client directly in this file
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
interface CustomDeckCard {
  deck_id: string;
  front: string;
  back: string;
  hint: string;
  sort_order: number;
  created_at: string;
}

export async function saveReviewerToSupabase(courseId: string, moduleId: string, reviewer: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const deckId = `${courseId}/${moduleId}/${reviewer.id}`;

    // Save to custom_decks table
    const { error: deckError } = await supabase
      .from("custom_decks")
      .upsert({
        id: deckId,
        user_id: user.id,
        title: reviewer.title || "Untitled Deck",
        description: "Imported from shared deck",
        card_count: reviewer.cards ? reviewer.cards.length : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (deckError) throw deckError;

    // Save the cards
    if (reviewer.cards && reviewer.cards.length > 0) {
      const cards = reviewer.cards.map((card: any, index: number) => ({
        deck_id: deckId,
        front: card.front,
        back: card.back,
        hint: card.hint || "",
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

      // Delete existing cards first
      await supabase
        .from("custom_deck_cards")
        .delete()
        .eq("deck_id", deckId);

      // Insert new cards
      const { error: cardsError } = await supabase
        .from("custom_deck_cards")
        .insert(cards);

      if (cardsError) throw cardsError;
    }

    // Trigger event to refresh decks
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("decksUpdated"));
      localStorage.setItem("decks_updated", Date.now().toString());
    }

    return { success: true, deckId };
  } catch (error) {
    console.error("Error saving deck:", error);
    throw error;
  }
}

export async function fetchDeckCards(deckId: string) {
  try {
    const { data, error } = await supabase
      .from("custom_deck_cards")
      .select("*")
      .eq("deck_id", deckId)
      .order("sort_order", { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching deck cards:", error);
    return [];
  }
}