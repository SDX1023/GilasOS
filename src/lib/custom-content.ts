// lib/custom-content.ts

import { getSupabase } from "./supabase";

export async function saveReviewerToSupabase(courseId: string, moduleId: string, reviewer: any) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use the reviewer.id directly as the deck ID
  const deckId = reviewer.id;

  console.log("Saving deck with ID:", deckId);
  console.log("Reviewer data:", reviewer);

  // Save to custom_decks table
  const { data: deckData, error: deckError } = await supabase
    .from("custom_decks")
    .upsert({
      id: deckId,
      user_id: user.id,
      title: reviewer.title || "Untitled Deck",
      description: "Imported from shared deck",
      card_count: reviewer.cards ? reviewer.cards.length : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (deckError) {
    console.error("Deck save error:", deckError);
    throw deckError;
  }

  console.log("Deck saved successfully:", deckData);

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
    const { data: cardsData, error: cardsError } = await supabase
      .from("custom_deck_cards")
      .insert(cards)
      .select();

    if (cardsError) {
      console.error("Cards save error:", cardsError);
      throw cardsError;
    }

    console.log("Cards saved successfully:", cardsData?.length || cards.length);
  }

  // Trigger event to refresh decks
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("decksUpdated"));
    localStorage.setItem("decks_updated", Date.now().toString());
  }

  return { success: true, deckId };
}