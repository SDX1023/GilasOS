"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "rgba(20,24,36,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "24px 28px", maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "rgba(239,68,68,0.12)" : "rgba(109,40,217,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {danger ? <Trash2 size={18} style={{ color: "#f87171" }} /> : <AlertTriangle size={18} style={{ color: "#a78bfa" }} />}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", margin: 0 }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, color: "var(--os-text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--os-text-secondary)", cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >{cancelLabel}</button>
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: danger ? "rgba(239,68,68,0.2)" : "var(--os-accent)", border: danger ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--os-accent)", color: danger ? "#f87171" : "#fff", cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = danger ? "rgba(239,68,68,0.3)" : "rgba(109,40,217,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = danger ? "rgba(239,68,68,0.2)" : "var(--os-accent)")}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
