import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Navbar } from "@/components/navbar";
import { Taskbar } from "@/components/taskbar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-context";
import { FloatingTimer } from "@/components/pomodoro/floating-timer";
import { PetProvider } from "@/components/pixel-pet/pet-context";
import PixelPet from "@/components/pixel-pet/pixel-pet";
import "./globals.css";

export const metadata: Metadata = {
  title: "GilasOS - The Ultimate GILAS Reviewer",
  description: "Guts. Instincts. Luck. Attitude. Skill.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthWrapper>
            <PomodoroProvider>
              <PetProvider>
                <div className="app-shell">
                  <ScrollToTop />
                  <Navbar />
                  <main className="app-main">{children}</main>
                  <Taskbar />
                </div>
                <FloatingTimer />
                <PixelPet />
              </PetProvider>
            </PomodoroProvider>
          </AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
