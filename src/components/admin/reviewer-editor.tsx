"use client";

import { useState, useCallback, useRef } from "react";
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
  card_type?: "standard" | "identification" | "image_label";
  image_url?: string;
  labels?: { x: number; y: number; text: string }[];
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

  const updateCard = (index: number, field: keyof FlashcardData, value: any) => {
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
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(["standard", "identification", "image_label"] as const).map((type) => (
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
                          {type === "standard" ? "Flip Card" : type === "identification" ? "Type Answer" : "Image Label"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Label Editor */}
                  {(card.card_type || "standard") === "image_label" ? (
                    <ImageLabelEditor
                      image_url={card.image_url || ""}
                      labels={card.labels || []}
                      onImageChange={(url) => updateCard(index, "image_url", url)}
                      onLabelsChange={(labels) => updateCard(index, "labels", labels)}
                    />
                  ) : (<>
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
                  </>)}

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

function ImageLabelEditor({ image_url, labels, onImageChange, onLabelsChange }: {
  image_url: string;
  labels: { x: number; y: number; text: string }[];
  onImageChange: (url: string) => void;
  onLabelsChange: (labels: { x: number; y: number; text: string }[]) => void;
}) {
  const [placing, setPlacing] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onImageChange(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const text = prompt("Enter the label text:");
    if (text && text.trim()) {
      onLabelsChange([...labels, { x, y, text: text.trim() }]);
    }
    setPlacing(false);
  };

  const updateLabel = (i: number, text: string) => {
    const next = labels.map((l, idx) => idx === i ? { ...l, text } : l);
    onLabelsChange(next);
  };

  const removeLabel = (i: number) => {
    onLabelsChange(labels.filter((_, idx) => idx !== i));
  };

  if (!image_url) {
    return (
      <div onClick={handleImageUpload} style={{ padding: 24, border: "2px dashed var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-dim)", fontSize: 13, cursor: "pointer", textAlign: "center" }}>
        Click to upload an image for labeling
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={handleImageUpload} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Change Image</button>
        <button onClick={() => setPlacing(!placing)} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11, ...(placing ? { background: "var(--os-accent)", color: "#fff" } : {}) }}>
          {placing ? "Click image to place..." : "+ Add Label"}
        </button>
        <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{labels.length} labels</span>
      </div>
      <div ref={imgRef} onClick={handleImageClick} style={{ position: "relative", cursor: placing ? "crosshair" : "default", borderRadius: 8, overflow: "hidden", border: "1px solid var(--os-glass-border)" }}>
        <img src={image_url} alt="Label" style={{ width: "100%", display: "block", maxHeight: 350, objectFit: "contain", background: "#000" }} />
        {labels.map((label, i) => (
          <div key={i} style={{ position: "absolute", left: `${label.x}%`, top: `${label.y}%`, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 4, zIndex: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--os-accent)", border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.5)" }} />
          </div>
        ))}
      </div>
      {labels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {labels.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--os-accent)", flexShrink: 0 }} />
              <input value={label.text} onChange={(e) => updateLabel(i, e.target.value)} style={{ flex: 1, padding: "4px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 6, color: "var(--os-text-primary)", fontSize: 12, outline: "none" }} />
              <button onClick={() => removeLabel(i)} style={{ padding: 3, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}