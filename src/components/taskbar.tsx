"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, Timer, FileText, CheckSquare, Trophy, Users, Sparkles, Archive } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Subjects", href: "/subjects", color: "#8b5cf6" },
  { icon: Sparkles, title: "Study", href: "/study", color: "#6d28d9" },
  { icon: Timer, title: "Pomodoro", href: "/pomodoro", color: "#10b981" },
  { icon: FileText, title: "PDF to Cards", href: "/pdf-to-cards", color: "#f59e0b" },
  { icon: CheckSquare, title: "Tasks", href: "/tasks", color: "#ec4899" },
  { icon: Users, title: "Friends", href: "/friends", color: "#06b6d4" },
  { icon: Archive, title: "Archive", href: "/archive", color: "#ef4444" },
  { icon: Trophy, title: "Leaderboard", href: "/leaderboard", color: "#eab308" },
];

export function Taskbar() {
  const pathname = usePathname();
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

  if (pathname === "/") return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="taskbar">
      {features.map((f) => {
        const active = isActive(f.href);
        return (
          <Link
            key={f.href}
            href={f.href}
            className={`taskbar-item${active ? " taskbar-active" : ""}`}
            title={f.title}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
          >
            <f.icon size={18} strokeWidth={active ? 2 : 1.5} />
          </Link>
        );
      })}
      <div className="taskbar-divider" />
      <div className="taskbar-time">{time}</div>
    </div>
  );
}
