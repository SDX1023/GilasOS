"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Brain, Timer, FileText, Sun, Moon, Heart, Trophy, CheckSquare } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/courses", label: "Subjects", icon: BookOpen },
  { href: "/reviewers", label: "Flash Cards", icon: Brain },
  { href: "/tools/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/tools/pdf-to-flashcards", label: "PDF to Cards", icon: FileText },
  { href: "/tools/todo", label: "To-Do", icon: CheckSquare },
  { href: "/archive", label: "Archive", icon: Trophy },
  { href: "/admin", label: "Sofia", icon: Heart },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <img src="/logo.png" alt="GilasOS" className="h-10 w-10 object-contain [html.light_&]:invert" />
            GilasOS
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 p-2 rounded-md hover:bg-muted transition-colors relative flex items-center justify-center w-9 h-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
