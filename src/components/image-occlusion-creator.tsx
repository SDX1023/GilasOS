"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Check, X, MousePointer2 } from "lucide-react";

interface DetectedLabel {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  selected: boolean;
}

interface ImageOcclusionCreatorProps {
  onGenerate: (cards: { front: string; back: string; image_url: string; labels: { x: number; y: number; w: number; h: number; text: string }[] }[]) => void;
  onCancel: () => void;
  initialImageUrl?: string;
  initialLabels?: { x: number; y: number; w: number; h: number; text: string }[];
}

export function ImageOcclusionCreator({ onGenerate, onCancel, initialImageUrl, initialLabels }: ImageOcclusionCreatorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [labels, setLabels] = useState<DetectedLabel[]>(initialLabels ? initialLabels.map(l => ({ ...l, selected: true })) : []);
  const [placing, setPlacing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [pendingRect, setPendingRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [resizing, setResizing] = useState<{ index: number; handle: string; startX: number; startY: number; startLabel: DetectedLabel } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const getRelativePos = (e: React.MouseEvent) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (resizing) return;
    if (!placing || !imgRef.current || showInput) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    setDragStart(pos);
    setDragCurrent(pos);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizing) return;
    if (!isDragging || !dragStart) return;
    setDragCurrent(getRelativePos(e));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (resizing) return;
    if (!isDragging || !dragStart) return;
    const pos = getRelativePos(e);
    const x = Math.min(dragStart.x, pos.x);
    const y = Math.min(dragStart.y, pos.y);
    const w = Math.abs(pos.x - dragStart.x);
    const h = Math.abs(pos.y - dragStart.y);
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    if (w > 0.5 && h > 0.5) {
      setPendingRect({ x, y, w, h });
      setShowInput(true);
      setLabelInput("");
    }
  };

  const confirmLabel = () => {
    if (!pendingRect || !labelInput.trim()) {
      setPendingRect(null);
      setShowInput(false);
      return;
    }
    setLabels((prev) => [...prev, { ...pendingRect, text: labelInput.trim(), selected: true }]);
    setPendingRect(null);
    setShowInput(false);
    setLabelInput("");
  };

  const cancelLabel = () => {
    setPendingRect(null);
    setShowInput(false);
    setLabelInput("");
  };

  const handleResizeStart = (e: React.MouseEvent, index: number, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({
      index,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startLabel: { ...labels[index] },
    });
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      setResizing((prev) => {
        if (!prev || !imgRef.current) return prev;
        const imgRect = imgRef.current.getBoundingClientRect();
        const dx = ((e.clientX - prev.startX) / imgRect.width) * 100;
        const dy = ((e.clientY - prev.startY) / imgRect.height) * 100;
        const sl = prev.startLabel;
        let { x, y, w, h } = sl;

        if (prev.handle.includes("e")) w = Math.max(1, sl.w + dx);
        if (prev.handle.includes("w")) { w = Math.max(1, sl.w - dx); x = sl.x + sl.w - w; }
        if (prev.handle.includes("s")) h = Math.max(1, sl.h + dy);
        if (prev.handle.includes("n")) { h = Math.max(1, sl.h - dy); y = sl.y + sl.h - h; }

        x = Math.max(0, Math.min(99, x));
        y = Math.max(0, Math.min(99, y));

        setLabels((prev2) => prev2.map((l, i) => i === prev!.index ? { ...l, x, y, w, h } : l));
        return prev;
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing]);

  const toggleLabel = (index: number) => {
    setLabels((prev) => prev.map((l, i) => i === index ? { ...l, selected: !l.selected } : l));
  };

  const removeLabel = (index: number) => {
    setLabels((prev) => prev.filter((_, i) => i !== index));
  };

  const selectAll = () => setLabels((prev) => prev.map((l) => ({ ...l, selected: true })));
  const deselectAll = () => setLabels((prev) => prev.map((l) => ({ ...l, selected: false })));

  const generate = () => {
    if (!imageUrl || labels.filter((l) => l.selected).length === 0) return;
    const selected = labels.filter((l) => l.selected);
    const cards = selected.map((label) => ({
      front: "What is hidden here?",
      back: label.text,
      image_url: imageUrl,
      labels: selected.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h, text: l.text })),
    }));
    onGenerate(cards);
  };

  const selectedCount = labels.filter((l) => l.selected).length;

  const dragRect = dragStart && dragCurrent ? {
    x: Math.min(dragStart.x, dragCurrent.x),
    y: Math.min(dragStart.y, dragCurrent.y),
    w: Math.abs(dragCurrent.x - dragStart.x),
    h: Math.abs(dragCurrent.y - dragStart.y),
  } : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        .occ-label-box { transition: filter 0.15s ease; }
        .occ-label-box:hover { filter: brightness(1.3); }
        .occ-handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 2px solid #7c3aed; border-radius: 2px; pointer-events: auto; }
        .occ-handle-nw { top: -5px; left: -5px; cursor: nwse-resize; }
        .occ-handle-ne { top: -5px; right: -5px; cursor: nesw-resize; }
        .occ-handle-sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
        .occ-handle-se { bottom: -5px; right: -5px; cursor: nwse-resize; }
        .occ-handle-n { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .occ-handle-s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .occ-handle-w { top: 50%; left: -5px; transform: translateY(-50%); cursor: ew-resize; }
        .occ-handle-e { top: 50%; right: -5px; transform: translateY(-50%); cursor: ew-resize; }
      `}</style>

      {!imageUrl ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%", height: 180, borderRadius: 12,
            border: "2px dashed rgba(255,255,255,0.15)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", gap: 8, color: "var(--os-text-dim)", transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(109,40,217,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        >
          <Upload size={28} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: 13 }}>Upload an image</span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Diagrams, charts, anatomy, maps...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            ref={imgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              position: "relative", borderRadius: 12, overflow: "visible",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: placing ? "crosshair" : "default",
            }}
          >
            <div style={{ borderRadius: 12, overflow: "hidden", position: "relative" }}>
              <img src={imageUrl} style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#0a0e18", display: "block", pointerEvents: "none" }} />

              {labels.map((label, i) => (
                <div
                  key={i}
                  className="occ-label-box"
                  onClick={(e) => { e.stopPropagation(); toggleLabel(i); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); removeLabel(i); }}
                  style={{
                    position: "absolute",
                    left: `${label.x}%`, top: `${label.y}%`,
                    width: `${label.w}%`, height: `${label.h}%`,
                    background: label.selected ? "#6d28d9" : "rgba(255,255,255,0.08)",
                    border: label.selected ? "2px solid #7c3aed" : "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 4, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 600, color: "#e9d5ff",
                  }}
                >
                  {label.selected ? label.text : ""}
                  {label.selected && (
                    <>
                      <div className="occ-handle occ-handle-nw" onMouseDown={(e) => handleResizeStart(e, i, "nw")} />
                      <div className="occ-handle occ-handle-ne" onMouseDown={(e) => handleResizeStart(e, i, "ne")} />
                      <div className="occ-handle occ-handle-sw" onMouseDown={(e) => handleResizeStart(e, i, "sw")} />
                      <div className="occ-handle occ-handle-se" onMouseDown={(e) => handleResizeStart(e, i, "se")} />
                      <div className="occ-handle occ-handle-n" onMouseDown={(e) => handleResizeStart(e, i, "n")} />
                      <div className="occ-handle occ-handle-s" onMouseDown={(e) => handleResizeStart(e, i, "s")} />
                      <div className="occ-handle occ-handle-w" onMouseDown={(e) => handleResizeStart(e, i, "w")} />
                      <div className="occ-handle occ-handle-e" onMouseDown={(e) => handleResizeStart(e, i, "e")} />
                    </>
                  )}
                </div>
              ))}

              {dragRect && dragRect.w > 0.3 && (
                <div style={{
                  position: "absolute",
                  left: `${dragRect.x}%`, top: `${dragRect.y}%`,
                  width: `${dragRect.w}%`, height: `${dragRect.h}%`,
                  background: "rgba(109,40,217,0.3)",
                  border: "2px dashed rgba(124,58,237,0.8)",
                  borderRadius: 4, pointerEvents: "none",
                }} />
              )}
            </div>
          </div>

          {showInput && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                autoFocus
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmLabel(); if (e.key === "Escape") cancelLabel(); }}
                placeholder="Type the label text..."
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(109,40,217,0.5)",
                  color: "var(--os-text-primary)", fontSize: 13, outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <button onClick={confirmLabel} className="glass-btn-primary" style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={13} /> Add
              </button>
              <button onClick={cancelLabel} className="glass-btn" style={{ padding: "6px 10px", fontSize: 12 }}>
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => { setPlacing(!placing); setDragStart(null); setDragCurrent(null); setShowInput(false); setPendingRect(null); }}
              className="glass-btn"
              style={{
                padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4,
                background: placing ? "rgba(29,185,84,0.15)" : undefined,
                color: placing ? "#1db954" : undefined,
                border: placing ? "1px solid rgba(29,185,84,0.3)" : undefined,
              }}
            >
              <MousePointer2 size={11} /> {placing ? "Draw a rectangle on the image..." : "+ Draw Box"}
            </button>

            {labels.length > 0 && (
              <>
                <button onClick={selectAll} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>All</button>
                <button onClick={deselectAll} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>None</button>
              </>
            )}
            <button onClick={() => { setImageUrl(null); setLabels([]); setPlacing(false); setDragStart(null); setDragCurrent(null); setShowInput(false); setPendingRect(null); }} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Change Image</button>
          </div>

          {labels.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
              {selectedCount} of {labels.length} labels — click to toggle, right-click to remove, drag edges to resize
            </div>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={generate}
          disabled={!imageUrl || selectedCount === 0}
          className="glass-btn-primary"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", fontSize: 13,
            opacity: !imageUrl || selectedCount === 0 ? 0.4 : 1,
          }}
        >
          <Check size={14} /> Generate {selectedCount} Cards
        </button>
        <button onClick={onCancel} className="glass-btn" style={{ padding: "8px 16px", fontSize: 13 }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}
