"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, PenTool, Users, Sun, Moon, LogIn, LogOut, User, Settings, Menu, X, Shield, Timer, FileText, CheckSquare, Trophy, Link as LinkIcon, Layers } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/study", label: "Study", icon: PenTool },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/friends", label: "Friends", icon: Users },
];

const toolItems = [
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/pdf-to-cards", label: "PDF to Cards", icon: FileText },
  { href: "/archive", label: "Archive", icon: Trophy },
  { href: "/shared", label: "Shared", icon: LinkIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, username, isAdmin, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setShowMobile(false); setShowTools(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setShowTools(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (pathname === "/") return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isToolsActive = toolItems.some((item) => isActive(item.href));

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--os-glass-border)",
      background: "var(--os-glass)", backdropFilter: "blur(20px)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, textDecoration: "none", color: "var(--os-text-primary)", flexShrink: 0 }}>
              <img src="/logo.png" alt="GilasOS" style={{ height: 28, width: 28, objectFit: "contain" }} />
              <span>GilasOS</span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }} className="nav-desktop">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8,
                    fontSize: 13, fontWeight: 500, textDecoration: "none",
                    background: isActive(item.href) ? "var(--os-accent)" : "transparent",
                    color: isActive(item.href) ? "#fff" : "var(--os-text-dim)",
                  }}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Tools Dropdown */}
              <div style={{ position: "relative" }} ref={toolsRef}>
                <button
                  onClick={() => setShowTools(!showTools)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8,
                    fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif",
                    background: isToolsActive ? "var(--os-accent)" : "transparent",
                    color: isToolsActive ? "#fff" : "var(--os-text-dim)",
                    border: "none", cursor: "pointer",
                  }}
                >
                  <Settings size={15} />
                  <span>Tools</span>
                </button>
                {showTools && (
                  <div style={{
                    position: "absolute", left: 0, top: "100%", marginTop: 4,
                    width: 200, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(15,21,35,0.95)", backdropFilter: "blur(20px)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.4)", zIndex: 50, padding: "4px 0",
                  }}>
                    {toolItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowTools(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                          fontSize: 13, textDecoration: "none",
                          background: isActive(item.href) ? "rgba(var(--os-accent-rgb), 0.15)" : "transparent",
                          color: isActive(item.href) ? "var(--os-accent)" : "var(--os-text-secondary)",
                        }}
                      >
                        <item.icon size={15} /> {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isAdmin && (
                <Link href="/admin" className="nav-link" style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, textDecoration: "none",
                  background: isActive("/admin") ? "var(--os-accent)" : "transparent",
                  color: isActive("/admin") ? "#fff" : "var(--os-text-dim)",
                }}>
                  <Shield size={15} /> <span>Admin</span>
                </Link>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setTheme((resolvedTheme || theme) === "dark" ? "light" : "dark")}
              style={{
                padding: 6, borderRadius: 8, background: "none", border: "none",
                color: "var(--os-text-dim)", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", width: 32, height: 32,
              }}
              title="Toggle theme"
            >
              {mounted ? (
                <>
                  <Sun size={15} style={{ display: (resolvedTheme || theme) === "dark" ? "block" : "none" }} />
                  <Moon size={15} style={{ display: (resolvedTheme || theme) === "light" ? "block" : "none" }} />
                </>
              ) : (
                <Sun size={15} />
              )}
            </button>

            <div style={{ position: "relative" }} ref={menuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                      borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                      background: "none", color: "var(--os-text-secondary)", cursor: "pointer",
                      fontSize: 13, fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <User size={15} />
                    <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username || user.email?.split("@")[0]}</span>
                  </button>
                  {showMenu && (
                    <div style={{
                      position: "absolute", right: 0, top: "100%", marginTop: 4,
                      width: 200, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(15,21,35,0.95)", backdropFilter: "blur(20px)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)", zIndex: 50, padding: "4px 0",
                    }}>
                      <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--os-text-dim)", borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                        {isAdmin && <span style={{ marginLeft: 4, color: "var(--os-accent)", fontWeight: 500 }}>Admin</span>}
                      </div>
                      <Link href="/profile" onClick={() => setShowMenu(false)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                        fontSize: 13, textDecoration: "none", color: "var(--os-text-secondary)",
                      }}>
                        <User size={15} /> Profile
                      </Link>
                      <Link href="/settings" onClick={() => setShowMenu(false)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                        fontSize: 13, textDecoration: "none", color: "var(--os-text-secondary)",
                      }}>
                        <Settings size={15} /> Settings
                      </Link>
                      <button onClick={() => { signOut(); setShowMenu(false); }} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                        fontSize: 13, background: "none", border: "none", width: "100%",
                        color: "var(--os-text-secondary)", cursor: "pointer", textAlign: "left",
                        fontFamily: "Inter, sans-serif",
                      }}>
                        <LogOut size={15} /> Log Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/login" style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                  borderRadius: 8, border: "1px solid var(--os-accent)",
                  color: "var(--os-accent)", textDecoration: "none", fontSize: 13, fontWeight: 500,
                }}>
                  <LogIn size={15} /> <span>Log In</span>
                </Link>
              )}
            </div>

            <button
              onClick={() => setShowMobile(!showMobile)}
              className="nav-mobile-btn"
              style={{
                padding: 6, borderRadius: 8, background: "none", border: "none",
                color: "var(--os-text-dim)", cursor: "pointer", display: "none",
              }}
            >
              {showMobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {showMobile && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(15,21,35,0.95)", padding: 12,
        }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none",
                background: isActive(item.href) ? "var(--os-accent)" : "transparent",
                color: isActive(item.href) ? "#fff" : "var(--os-text-dim)",
                marginBottom: 2,
              }}
            >
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8, paddingTop: 8 }}>
            <p style={{ fontSize: 11, color: "var(--os-text-dim)", padding: "4px 12px", marginBottom: 4 }}>TOOLS</p>
            {toolItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none",
                  background: isActive(item.href) ? "rgba(var(--os-accent-rgb), 0.15)" : "transparent",
                  color: isActive(item.href) ? "var(--os-accent)" : "var(--os-text-dim)",
                  marginBottom: 2,
                }}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            ))}
          </div>
          {isAdmin && (
            <Link href="/admin" className="nav-link" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none",
              background: isActive("/admin") ? "var(--os-accent)" : "transparent",
              color: isActive("/admin") ? "#fff" : "var(--os-text-dim)",
            }}>
              <Shield size={18} /> Admin
            </Link>
          )}
          <button
            onClick={() => setTheme((resolvedTheme || theme) === "dark" ? "light" : "dark")}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: "transparent", border: "none", width: "100%",
              color: "var(--os-text-dim)", cursor: "pointer", textAlign: "left",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {mounted ? (
              <>
                <Sun size={18} style={{ display: (resolvedTheme || theme) === "dark" ? "block" : "none" }} />
                <Moon size={18} style={{ display: (resolvedTheme || theme) === "light" ? "block" : "none" }} />
              </>
            ) : (
              <Sun size={18} />
            )}
            {(resolvedTheme || theme) === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      )}
    </nav>
  );
}
