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
    setCards([...cards, { front: "", back: "", hint: "" }]);
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{courseId}</span>
            <span>/</span>
            <span>{moduleId}</span>
            <span>/</span>
            <span>reviewer</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {validCardCount} cards
          </span>
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-8 pt-8 pb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Reviewer"
          className="w-full text-4xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div
              key={index}
              className="border rounded-lg bg-card overflow-hidden"
            >
              {/* Card Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedCard(expandedCard === index ? null : index)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                {expandedCard === index ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium flex-1">
                  {card.front || <span className="text-muted-foreground italic">Empty card</span>}
                </span>
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateCard(index);
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Duplicate"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCard(index);
                  }}
                  className="p-1 hover:bg-muted rounded text-red-500"
                  title="Delete"
                  disabled={cards.length <= 1}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Card Content */}
              {expandedCard === index && (
                <div className="px-4 pb-4 space-y-3 border-t">
                  <div className="pt-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Front (Question)
                    </label>
                    <textarea
                      value={card.front}
                      onChange={(e) => updateCard(index, "front", e.target.value)}
                      placeholder="Enter the question or prompt..."
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background resize-none h-24 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Back (Answer)
                    </label>
                    <textarea
                      value={card.back}
                      onChange={(e) => updateCard(index, "back", e.target.value)}
                      placeholder="Enter the answer..."
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background resize-none h-24 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Hint (Optional)
                    </label>
                    <input
                      type="text"
                      value={card.hint || ""}
                      onChange={(e) => updateCard(index, "hint", e.target.value)}
                      placeholder="Optional hint..."
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveCard(index, "up")}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs bg-muted rounded disabled:opacity-50"
                      >
                        ↑ Move Up
                      </button>
                      <button
                        onClick={() => moveCard(index, "down")}
                        disabled={index === cards.length - 1}
                        className="px-2 py-1 text-xs bg-muted rounded disabled:opacity-50"
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
          className="w-full mt-4 p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Card
        </button>
      </div>
    </div>
  );
}
