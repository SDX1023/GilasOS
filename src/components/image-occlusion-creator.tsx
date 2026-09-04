"use client";

import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Upload, Loader2, Check, X, Eye, EyeOff, Wand2 } from "lucide-react";

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
  const [previewLabel, setPreviewLabel] = useState<number | null>(null);
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
    setScanProgress("Initializing OCR...");
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setScanProgress(`Scanning... ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();

      const img = new Image();
      img.src = imageUrl;
      await new Promise<void>((r) => { img.onload = () => r(); });

      const words = (data as any).words || [];
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
      setScanProgress("OCR failed — try a clearer image");
    } finally {
      setScanning(false);
    }
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
          <div ref={imgRef} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={imageUrl} style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#0a0e18", display: "block" }} />
            {labels.map((label, i) => (
              <div
                key={i}
                className="occ-label-box"
                onClick={() => toggleLabel(i)}
                onMouseEnter={() => setPreviewLabel(i)}
                onMouseLeave={() => setPreviewLabel(null)}
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
                  animation: previewLabel === i ? "occPulse 1s ease infinite" : "none",
                }}
              >
                {label.selected ? label.text : ""}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!scanning && labels.length === 0 && (
              <button onClick={runOCR} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
                <Wand2 size={14} /> Auto-Detect Labels
              </button>
            )}
            {scanning && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, color: "var(--os-text-dim)" }}>
                <Loader2 size={14} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                {scanProgress}
              </div>
            )}
            {labels.length > 0 && !scanning && (
              <>
                <button onClick={selectAll} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Select All</button>
                <button onClick={deselectAll} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Deselect All</button>
                <button onClick={runOCR} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <Wand2 size={12} /> Re-Scan
                </button>
              </>
            )}
            <button onClick={() => { setImageUrl(null); setLabels([]); }} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Change Image</button>
          </div>

          {labels.length > 0 && !scanning && (
            <div style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
              {labels.filter((l) => l.selected).length} of {labels.length} labels selected — each becomes a flashcard with that label occluded
            </div>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={generate}
          disabled={!imageUrl || labels.filter((l) => l.selected).length === 0}
          className="glass-btn-primary"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", fontSize: 13,
            opacity: !imageUrl || labels.filter((l) => l.selected).length === 0 ? 0.4 : 1,
          }}
        >
          <Check size={14} /> Generate {labels.filter((l) => l.selected).length} Cards
        </button>
        <button onClick={onCancel} className="glass-btn" style={{ padding: "8px 16px", fontSize: 13 }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}
