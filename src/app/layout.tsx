import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Navbar } from "@/components/navbar";
import { Taskbar } from "@/components/taskbar";
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
            <div className="app-shell">
              <Navbar />
              <main className="app-main">{children}</main>
              <Taskbar />
            </div>
          </AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
