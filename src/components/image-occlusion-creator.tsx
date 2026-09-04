"use client";

import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Upload, Loader2, Check, X, Wand2, MousePointer2 } from "lucide-react";

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
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [placing, setPlacing] = useState(false);
  const [placeStart, setPlaceStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [showInput, setShowInput] = useState(false);
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

  const handleManualClick = (e: React.MouseEvent) => {
    if (!placing || !imgRef.current) return;
    const pos = getRelativePos(e);

    if (!placeStart) {
      setPlaceStart(pos);
    } else {
      setShowInput(true);
      setLabelInput("");
      setMousePos(pos);
    }
  };

  const confirmLabel = () => {
    if (!placeStart || !mousePos || !labelInput.trim()) {
      setPlaceStart(null);
      setMousePos(null);
      setShowInput(false);
      return;
    }
    const x = Math.min(placeStart.x, mousePos.x);
    const y = Math.min(placeStart.y, mousePos.y);
    const w = Math.abs(mousePos.x - placeStart.x);
    const h = Math.abs(mousePos.y - placeStart.y);
    if (w > 0.5 && h > 0.5) {
      setLabels((prev) => [...prev, { x, y, w, h, text: labelInput.trim(), selected: true }]);
    }
    setPlaceStart(null);
    setMousePos(null);
    setShowInput(false);
    setLabelInput("");
  };

  const cancelLabel = () => {
    setPlaceStart(null);
    setMousePos(null);
    setShowInput(false);
    setLabelInput("");
  };

  const runOCR = async () => {
    if (!imageUrl) return;
    setScanning(true);
    setScanProgress("Loading OCR engine...");
    try {
      const worker = await createWorker("eng");
      setScanProgress("Scanning image...");
      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();

      const img = new Image();
      img.src = imageUrl;
      await new Promise<void>((r) => { img.onload = () => r(); });

      const allWords: any[] = (data as any).words || [];
      const noisePatterns = /^[\d.,©®™°•·–—""''()\[\]{}/\\|@#$%&*+=<>^~`]+$/;
      const copyrightPatterns = /cleveland|clinic|copyright|©|®|all rights|reserved|\d{4}/i;

      const goodWords = allWords.filter((w: any) => {
        if (!w.text || !w.bbox) return false;
        const t = w.text.trim();
        if (t.length < 2) return false;
        if ((w.confidence || 0) < 40) return false;
        const bw = w.bbox.x1 - w.bbox.x0;
        const bh = w.bbox.y1 - w.bbox.y0;
        if (bw < img.width * 0.01 || bh < img.height * 0.005) return false;
        if (noisePatterns.test(t)) return false;
        if (copyrightPatterns.test(t)) return false;
        return true;
      });

      const wordBoxes = goodWords.map((w: any) => ({
        x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1,
        text: w.text.trim().replace(/[""]/g, '"').replace(/['']/g, "'"),
        lineY: (w.bbox.y0 + w.bbox.y1) / 2,
        lineH: w.bbox.y1 - w.bbox.y0,
      }));

      const mergedLines: { text: string; x0: number; y0: number; x1: number; y1: number }[] = [];
      const used = new Set<number>();
      const byY = [...wordBoxes].sort((a, b) => a.lineY - b.lineY);

      for (let i = 0; i < byY.length; i++) {
        if (used.has(i)) continue;
        let group = [byY[i]];
        used.add(i);
        for (let j = i + 1; j < byY.length; j++) {
          if (used.has(j)) continue;
          const a = group[group.length - 1];
          const b = byY[j];
          if (Math.abs(b.lineY - a.lineY) > Math.min(a.lineH, b.lineH) * 0.6) break;
          const gap = Math.abs(b.x0 - a.x1);
          if (gap < img.width * 0.03 && gap >= 0) {
            group.push(b);
            used.add(j);
          }
        }
        group.sort((a, b) => a.x0 - b.x0);
        const lineW = Math.max(...group.map((g) => g.x1)) - Math.min(...group.map((g) => g.x0));
        if (lineW > img.width * 0.25) continue;
        const lineText = group.map((g) => g.text).join(" ");
        if (copyrightPatterns.test(lineText)) continue;
        mergedLines.push({
          text: lineText,
          x0: Math.min(...group.map((g) => g.x0)),
          y0: Math.min(...group.map((g) => g.y0)),
          x1: Math.max(...group.map((g) => g.x1)),
          y1: Math.max(...group.map((g) => g.y1)),
        });
      }

      const byText = new Map<string, typeof mergedLines[0]>();
      for (const line of mergedLines) {
        const key = line.text.toLowerCase().trim();
        const existing = byText.get(key);
        if (!existing || ((line.x1 - line.x0) * (line.y1 - line.y0)) > ((existing.x1 - existing.x0) * (existing.y1 - existing.y0))) {
          byText.set(key, line);
        }
      }

      const result: DetectedLabel[] = [...byText.values()].map((line) => ({
        x: (line.x0 / img.width) * 100,
        y: (line.y0 / img.height) * 100,
        w: ((line.x1 - line.x0) / img.width) * 100,
        h: ((line.y1 - line.y0) / img.height) * 100,
        text: line.text,
        selected: true,
      }));

      setLabels(result);
      setScanProgress(`Found ${result.length} labels`);
    } catch (err) {
      console.error("OCR failed:", err);
      setScanProgress("OCR failed");
    } finally {
      setScanning(false);
    }
  };

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

  const previewRect = placeStart && mousePos && !showInput ? {
    x: Math.min(placeStart.x, mousePos.x),
    y: Math.min(placeStart.y, mousePos.y),
    w: Math.abs(mousePos.x - placeStart.x),
    h: Math.abs(mousePos.y - placeStart.y),
  } : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        @keyframes occPulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
        .occ-label-box { transition: all 0.15s ease; }
        .occ-label-box:hover { filter: brightness(1.3); }
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
            onClick={mode === "manual" && placing ? handleManualClick : undefined}
            onMouseMove={mode === "manual" && placing && placeStart && !showInput ? (e) => setMousePos(getRelativePos(e)) : undefined}
            style={{
              position: "relative", borderRadius: 12, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: mode === "manual" && placing ? "crosshair" : "default",
            }}
          >
            <img src={imageUrl} style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#0a0e18", display: "block" }} />

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
                  fontSize: 10, fontWeight: 600,
                  color: "#e9d5ff",
                }}
              >
                {label.selected ? label.text : ""}
              </div>
            ))}

            {previewRect && previewRect.w > 0.3 && (
              <div style={{
                position: "absolute",
                left: `${previewRect.x}%`, top: `${previewRect.y}%`,
                width: `${previewRect.w}%`, height: `${previewRect.h}%`,
                background: "rgba(109,40,217,0.3)",
                border: "2px dashed rgba(124,58,237,0.8)",
                borderRadius: 4, pointerEvents: "none",
              }} />
            )}

            {placing && placeStart && !showInput && (
              <div style={{
                position: "absolute",
                left: `${placeStart.x}%`, top: `${placeStart.y}%`,
                width: 8, height: 8, borderRadius: "50%",
                background: "#1db954", transform: "translate(-50%, -50%)",
                boxShadow: "0 0 8px rgba(29,185,84,0.6)", pointerEvents: "none",
              }} />
            )}
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
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => { setMode("manual"); setPlacing(false); setPlaceStart(null); setMousePos(null); setShowInput(false); }}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                  background: mode === "manual" ? "rgba(109,40,217,0.3)" : "transparent",
                  color: mode === "manual" ? "#c4b5fd" : "var(--os-text-dim)",
                }}
              >
                <MousePointer2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Manual
              </button>
              <button
                onClick={() => { setMode("auto"); setPlacing(false); setPlaceStart(null); setMousePos(null); setShowInput(false); }}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                  background: mode === "auto" ? "rgba(109,40,217,0.3)" : "transparent",
                  color: mode === "auto" ? "#c4b5fd" : "var(--os-text-dim)",
                }}
              >
                <Wand2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Auto
              </button>
            </div>

            {mode === "manual" ? (
              <button
                onClick={() => { setPlacing(!placing); setPlaceStart(null); setMousePos(null); setShowInput(false); }}
                className="glass-btn"
                style={{
                  padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4,
                  background: placing ? "rgba(29,185,84,0.15)" : undefined,
                  color: placing ? "#1db954" : undefined,
                  border: placing ? "1px solid rgba(29,185,84,0.3)" : undefined,
                }}
              >
                <MousePointer2 size={11} /> {placing ? (placeStart ? "Click 2nd corner..." : "Click 1st corner...") : "+ Draw Box"}
              </button>
            ) : (
              <>
                {!scanning && (
                  <button onClick={runOCR} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 12 }}>
                    <Wand2 size={12} /> {labels.length > 0 ? "Re-Scan" : "Auto-Detect"}
                  </button>
                )}
                {scanning && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", fontSize: 12, color: "var(--os-text-dim)" }}>
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                    {scanProgress}
                  </div>
                )}
              </>
            )}

            {labels.length > 0 && (
              <>
                <button onClick={selectAll} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>All</button>
                <button onClick={deselectAll} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>None</button>
              </>
            )}
            <button onClick={() => { setImageUrl(null); setLabels([]); setPlacing(false); setPlaceStart(null); setMousePos(null); setShowInput(false); }} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Change Image</button>
          </div>

          {labels.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
              {selectedCount} of {labels.length} labels — click to toggle, right-click to remove
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
