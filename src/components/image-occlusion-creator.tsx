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
}

export function ImageOcclusionCreator({ onGenerate, onCancel }: ImageOcclusionCreatorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [labels, setLabels] = useState<DetectedLabel[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [placing, setPlacing] = useState(false);
  const [placeStart, setPlaceStart] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

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

      const words: any[] = (data as any).words || [];
      const detected: DetectedLabel[] = words
        .filter((w: any) => w.text && w.text.trim().length > 0 && w.bbox)
        .map((w: any) => ({
          x: (w.bbox.x0 / img.width) * 100,
          y: (w.bbox.y0 / img.height) * 100,
          w: ((w.bbox.x1 - w.bbox.x0) / img.width) * 100,
          h: ((w.bbox.y1 - w.bbox.y0) / img.height) * 100,
          text: w.text.trim(),
          selected: true,
        }));

      setLabels(detected);
      setScanProgress(`Found ${detected.length} labels`);
    } catch (err) {
      console.error("OCR failed:", err);
      setScanProgress("OCR failed — try manual mode");
    } finally {
      setScanning(false);
    }
  };

  const handleManualClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!placeStart) {
      setPlaceStart({ x, y });
    } else {
      const text = prompt("Label text:");
      if (text?.trim()) {
        const newX = Math.min(placeStart.x, x);
        const newY = Math.min(placeStart.y, y);
        const newW = Math.abs(x - placeStart.x);
        const newH = Math.abs(y - placeStart.y);
        setLabels((prev) => [...prev, { x: newX, y: newY, w: newW, h: newH, text: text.trim(), selected: true }]);
      }
      setPlaceStart(null);
      setPlacing(false);
    }
  };

  const removeLabel = (index: number) => {
    setLabels((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleLabel = (index: number) => {
    setLabels((prev) => prev.map((l, i) => i === index ? { ...l, selected: !l.selected } : l));
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
            width: "100%",
            height: 180,
            borderRadius: 12,
            border: "2px dashed rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            gap: 8,
            color: "var(--os-text-dim)",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(109,40,217,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        >
          <Upload size={28} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: 13 }}>Upload an image with labels</span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Diagrams, charts, anatomy, maps...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            ref={imgRef}
            onClick={mode === "manual" && placing ? handleManualClick : undefined}
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
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
                  left: `${label.x}%`,
                  top: `${label.y}%`,
                  width: `${label.w}%`,
                  height: `${label.h}%`,
                  background: label.selected ? "rgba(109,40,217,0.35)" : "rgba(255,255,255,0.08)",
                  border: label.selected ? "2px solid rgba(109,40,217,0.8)" : "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: label.selected ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                }}
              >
                {label.selected ? label.text : ""}
              </div>
            ))}
            {placing && placeStart && (
              <div style={{
                position: "absolute",
                left: `${placeStart.x}%`,
                top: `${placeStart.y}%`,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#1db954",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 8px rgba(29,185,84,0.6)",
                pointerEvents: "none",
              }} />
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => { setMode("auto"); setPlacing(false); setPlaceStart(null); }}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                  background: mode === "auto" ? "rgba(109,40,217,0.3)" : "transparent",
                  color: mode === "auto" ? "#c4b5fd" : "var(--os-text-dim)",
                }}
              >
                <Wand2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Auto
              </button>
              <button
                onClick={() => { setMode("manual"); setPlacing(false); setPlaceStart(null); }}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                  background: mode === "manual" ? "rgba(109,40,217,0.3)" : "transparent",
                  color: mode === "manual" ? "#c4b5fd" : "var(--os-text-dim)",
                }}
              >
                <MousePointer2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Manual
              </button>
            </div>

            {mode === "auto" ? (
              <>
                {!scanning && labels.length === 0 && (
                  <button onClick={runOCR} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12 }}>
                    <Wand2 size={13} /> Auto-Detect
                  </button>
                )}
                {scanning && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", fontSize: 12, color: "var(--os-text-dim)" }}>
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    {scanProgress}
                  </div>
                )}
                {labels.length > 0 && !scanning && (
                  <button onClick={runOCR} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Wand2 size={11} /> Re-Scan
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => { setPlacing(!placing); setPlaceStart(null); }}
                className="glass-btn"
                style={{
                  padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4,
                  background: placing ? "rgba(29,185,84,0.15)" : undefined,
                  color: placing ? "#1db954" : undefined,
                  border: placing ? "1px solid rgba(29,185,84,0.3)" : undefined,
                }}
              >
                <MousePointer2 size={11} /> {placing ? "Click two corners..." : "+ Add Box"}
              </button>
            )}

            {labels.length > 0 && (
              <>
                <button onClick={selectAll} className="glass-btn" style={{ padding: "5px 10px", fontSize: 11 }}>All</button>
                <button onClick={deselectAll} className="glass-btn" style={{ padding: "5px 10px", fontSize: 11 }}>None</button>
              </>
            )}
            <button onClick={() => { setImageUrl(null); setLabels([]); setPlacing(false); setPlaceStart(null); }} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Change Image</button>
          </div>

          {labels.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
              {selectedCount} of {labels.length} labels selected — right-click a label to remove it
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
