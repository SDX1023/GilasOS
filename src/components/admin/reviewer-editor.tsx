"use client";

import { useState, useCallback } from "react";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface FlashcardData {
  id?: string;
  front: string;
  back: string;
  hint?: string;
  card_type?: "standard" | "identification";
}

interface ReviewerEditorProps {
  courseId: string;
  moduleId: string;
  reviewerId?: string;
  initialTitle?: string;
  initialCards?: FlashcardData[];
  onSave: (reviewer: { id: string; title: string; cards: FlashcardData[] }) => void;
  onBack: () => void;
}

export function ReviewerEditor({
  courseId,
  moduleId,
  reviewerId,
  initialTitle = "",
  initialCards = [],
  onSave,
  onBack,
}: ReviewerEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [cards, setCards] = useState<FlashcardData[]>(
    initialCards.length > 0 ? initialCards : [{ front: "", back: "", hint: "" }]
  );
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    const id = reviewerId || `${courseId}/${moduleId}/${title.toLowerCase().replace(/\s+/g, "-")}`;
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    onSave({ id, title, cards: validCards });
    setLastSaved(new Date());
    setIsSaving(false);
  }, [title, cards, reviewerId, courseId, moduleId, onSave]);

  const addCard = () => {
    setCards([...cards, { front: "", back: "", hint: "", card_type: "standard" }]);
    setExpandedCard(cards.length);
  };

  const duplicateCard = (index: number) => {
    const newCards = [...cards];
    newCards.splice(index + 1, 0, { ...cards[index] });
    setCards(newCards);
  };

  const deleteCard = (index: number) => {
    if (cards.length <= 1) return;
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
    if (expandedCard === index) setExpandedCard(null);
    else if (expandedCard !== null && expandedCard > index) setExpandedCard(expandedCard - 1);
  };

  const updateCard = (index: number, field: keyof FlashcardData, value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const moveCard = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= cards.length) return;
    const newCards = [...cards];
    [newCards[fromIndex], newCards[toIndex]] = [newCards[toIndex], newCards[fromIndex]];
    setCards(newCards);
    if (expandedCard === fromIndex) setExpandedCard(toIndex);
    else if (expandedCard === toIndex) setExpandedCard(fromIndex);
  };

  const validCardCount = cards.filter((c) => c.front.trim() && c.back.trim()).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--os-glass-border)", background: "var(--os-bg-secondary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onBack}
            style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--os-text-dim)" }}>
            <span>{courseId}</span>
            <span>/</span>
            <span>{moduleId}</span>
            <span>/</span>
            <span>reviewer</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
            {validCardCount} cards
          </span>
          {lastSaved && (
            <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              background: (!title.trim() || isSaving) ? "var(--os-accent)" : "var(--os-accent)",
              opacity: (!title.trim() || isSaving) ? 0.5 : 1,
              border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 500,
              cursor: (!title.trim() || isSaving) ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "16px 16px 8px" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Reviewer"
          style={{
            width: "100%", fontSize: 28, fontWeight: 700, background: "transparent",
            border: "none", outline: "none", color: "var(--os-text-primary)",
            fontFamily: "Inter, sans-serif",
          }}
        />
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cards.map((card, index) => (
            <div
              key={index}
              className="glass-card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <GripVertical size={14} style={{ color: "var(--os-text-dim)", cursor: "grab", flexShrink: 0 }} />
                {expandedCard === index ? (
                  <ChevronDown size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, color: "var(--os-text-primary)" }}>
                  {card.front || <span style={{ color: "var(--os-text-dim)", fontStyle: "italic" }}>Empty card</span>}
                </span>
                <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>#{index + 1}</span>
                {(card.card_type || "standard") === "identification" && (
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 500 }}>Type-in</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateCard(index);
                  }}
                  style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Duplicate"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCard(index);
                  }}
                  style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: cards.length <= 1 ? "not-allowed" : "pointer", color: "#ef4444", opacity: cards.length <= 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Delete"
                  disabled={cards.length <= 1}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Card Content */}
              {expandedCard === index && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--os-glass-border)", display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
                  {/* Card Type Selector */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                      Card Type
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["standard", "identification"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => updateCard(index, "card_type", type)}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                            border: (card.card_type || "standard") === type ? "1.5px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.1)",
                            background: (card.card_type || "standard") === type ? "rgba(109,40,217,0.12)" : "rgba(255,255,255,0.03)",
                            color: (card.card_type || "standard") === type ? "var(--os-accent)" : "var(--os-text-secondary)",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {type === "standard" ? "Flip Card" : "Type Answer"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                      Front (Question)
                    </label>
                    <textarea
                      value={card.front}
                      onChange={(e) => updateCard(index, "front", e.target.value)}
                      placeholder="Enter the question or prompt..."
                      className="glass-input"
                      style={{ width: "100%", resize: "none", minHeight: 80, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                      Back (Answer)
                    </label>
                    <textarea
                      value={card.back}
                      onChange={(e) => updateCard(index, "back", e.target.value)}
                      placeholder="Enter the answer..."
                      className="glass-input"
                      style={{ width: "100%", resize: "none", minHeight: 80, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                      Hint (Optional)
                    </label>
                    <input
                      type="text"
                      value={card.hint || ""}
                      onChange={(e) => updateCard(index, "hint", e.target.value)}
                      placeholder="Optional hint..."
                      className="glass-input"
                      style={{ width: "100%", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => moveCard(index, "up")}
                        disabled={index === 0}
                        className="glass-btn"
                        style={{ padding: "4px 10px", fontSize: 11, opacity: index === 0 ? 0.4 : 1, cursor: index === 0 ? "not-allowed" : "pointer" }}
                      >
                        ↑ Move Up
                      </button>
                      <button
                        onClick={() => moveCard(index, "down")}
                        disabled={index === cards.length - 1}
                        className="glass-btn"
                        style={{ padding: "4px 10px", fontSize: 11, opacity: index === cards.length - 1 ? 0.4 : 1, cursor: index === cards.length - 1 ? "not-allowed" : "pointer" }}
                      >
                        ↓ Move Down
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Card Button */}
        <button
          onClick={addCard}
          style={{
            width: "100%", marginTop: 14, padding: 14,
            border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12,
            background: "transparent", cursor: "pointer",
            color: "var(--os-text-dim)", fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "Inter, sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "var(--os-text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--os-text-dim)"; }}
        >
          <Plus size={14} />
          Add Card
        </button>
      </div>
    </div>
  );
}