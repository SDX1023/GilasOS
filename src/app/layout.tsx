"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Navbar } from "@/components/navbar";
import { Taskbar } from "@/components/taskbar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-context";
import { FloatingTimer } from "@/components/pomodoro/floating-timer";
import { PetProvider } from "@/components/pixel-pet/pet-context";
import PixelPet from "@/components/pixel-pet/pixel-pet";
import CustomizationLoader from "@/components/customization-loader";
import BackgroundOverlay from "@/components/background-overlay";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import { MusicPlayer } from "@/components/music-player";
import { StartMenu } from "@/components/os-desktop";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthWrapper>
            <PomodoroProvider>
              <PetProvider>
                <div className="app-shell">
                  <ScrollToTop />
                  <CustomizationLoader />
                  <BackgroundOverlay />
                  {!isLanding && <Navbar />}
                  <main className="app-main">{children}</main>
                  {!isLanding && <Taskbar onStartClick={() => setStartMenuOpen(!startMenuOpen)} />}
                  <StartMenu isOpen={startMenuOpen} onClose={() => setStartMenuOpen(false)} />
                </div>
                <FloatingTimer />
                <PixelPet />
                <MusicPlayer />
                <ServiceWorkerRegistration />
              </PetProvider>
            </PomodoroProvider>
          </AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
