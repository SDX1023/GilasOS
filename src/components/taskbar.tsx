"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BookOpen, Layers, Timer, FileText, CheckSquare, Trophy } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Subjects", href: "/courses", color: "#00d4ff" },
  { icon: Layers, title: "Flashcards", href: "/flashcards", color: "#7c3aed" },
  { icon: Timer, title: "Pomodoro", href: "/tools/pomodoro", color: "#10b981" },
  { icon: FileText, title: "PDF to Cards", href: "/tools/pdf-to-flashcards", color: "#f59e0b" },
  { icon: CheckSquare, title: "Tasks", href: "/tools/todo", color: "#ec4899" },
  { icon: Trophy, title: "Archive", href: "/archive", color: "#ef4444" },
];

export function Taskbar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="taskbar">
      {features.map((f) => (
        <Link key={f.href} href={f.href} className="taskbar-item" title={f.title}>
          <f.icon size={18} strokeWidth={1.5} />
        </Link>
      ))}
      <div className="taskbar-divider" />
      <div className="taskbar-time">{time}</div>
    </div>
  );
}
