"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Minus, Square, X, GripVertical } from "lucide-react";

interface OSWindowProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

export function OSWindow({
  title,
  icon,
  children,
  onClose,
  onMinimize,
  onMaximize,
  defaultX = 100,
  defaultY = 80,
  defaultWidth = 800,
  defaultHeight = 600,
  minWidth = 400,
  minHeight = 300,
  className,
}: OSWindowProps) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging) {
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    }
    if (isResizing) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setSize({
        w: Math.max(minWidth, resizeStart.current.w + dx),
        h: Math.max(minHeight, resizeStart.current.h + dy),
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) return;
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setSize({ w: defaultWidth, h: defaultHeight });
      setPos({ x: defaultX, y: defaultY });
    } else {
      setIsMaximized(true);
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight - 56 });
    }
    onMaximize?.();
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, isResizing]);

  return (
    <div
      ref={windowRef}
      className={className}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        borderRadius: isMaximized ? 0 : 12,
        background: "var(--os-glass)",
        border: isMaximized ? "none" : "1px solid var(--os-glass-border)",
        backdropFilter: "blur(24px)",
        boxShadow: isMaximized ? "none" : "0 25px 60px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={handleMaximize}
        style={{
          height: 36,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          borderBottom: "1px solid var(--os-glass-border)",
          cursor: isMaximized ? "default" : "grab",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {icon && (
          <div style={{ marginRight: 8, display: "flex", alignItems: "center", color: "var(--os-accent)" }}>
            {icon}
          </div>
        )}
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--os-text-primary)",
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {title}
        </span>

        {/* Window controls */}
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "var(--os-text-dim)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <Minus size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleMaximize(); }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "var(--os-text-dim)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <Square size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "rgba(239,68,68,0.1)",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {children}
      </div>

      {/* Resize handle */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: 2,
          }}
        >
          <GripVertical size={10} style={{ color: "var(--os-text-dim)", transform: "rotate(45deg)" }} />
        </div>
      )}
    </div>
  );
}
