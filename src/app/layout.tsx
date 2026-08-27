import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-context";
import { FloatingTimer } from "@/components/pomodoro/floating-timer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GilasOS",
  description: "Guts. Instincts. Luck. Attitude. Skill. The Ultimate GILAS Reviewer",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PomodoroProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <FloatingTimer />
          </PomodoroProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
