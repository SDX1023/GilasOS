const handleSave = async () => {
  if (!user || !deck) return;
  setSaving(true);
  try {
    // Use the deck ID directly as the reviewer ID
    // Don't re-concatenate it
    const reviewer = {
      id: deck.id,  // Use the shared deck's ID directly
      courseId: deck.course_id || "My Decks",
      moduleId: deck.module_id || "shared",
      title: deck.title,
      cards: cards.map((c) => ({ front: c.front, back: c.back, hint: c.hint || "" })),
    };
    
    await saveReviewerToSupabase(reviewer.courseId, reviewer.moduleId, reviewer);
    setSaved(true);
    
    // Trigger event for decks page
    window.dispatchEvent(new CustomEvent("decksUpdated"));
    
    // Redirect to My Decks after saving
    setTimeout(() => {
      router.push("/decks");
    }, 800);
  } catch (error) {
    console.error("Error saving deck:", error);
  } finally {
    setSaving(false);
  }
};