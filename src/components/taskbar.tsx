"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Sparkles, Layers, FileText, CheckSquare, Users, Trophy, Archive, BarChart3, Calculator } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Subjects", href: "/subjects", color: "#60a5fa" },
  { icon: Sparkles, title: "Study", href: "/flashcards", color: "#a78bfa" },
  { icon: Layers, title: "My Decks", href: "/decks", color: "#c084fc" },
  { icon: Calculator, title: "Speed Math", href: "/speedmath", color: "#f97316" },
  { icon: FileText, title: "PDF to Cards", href: "/pdf-to-cards", color: "#fbbf24" },
  { icon: CheckSquare, title: "Tasks", href: "/tasks", color: "#34d399" },
  { icon: Users, title: "Friends", href: "/friends", color: "#22d3ee" },
  { icon: Trophy, title: "Leaderboard", href: "/leaderboard", color: "#facc15" },
  { icon: Archive, title: "Archive", href: "/archive", color: "#f87171" },
  { icon: BarChart3, title: "Analytics", href: "/analytics", color: "#0ea5e9" },
];

export function Taskbar() {
  const pathname = usePathname();

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
            style={{ color: active ? f.color : undefined }}
          >
            <f.icon size={20} strokeWidth={active ? 2.2 : 1.6} />
          </Link>
        );
      })}
    </div>
  );
}
