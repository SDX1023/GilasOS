import type { Metadata } from "next";
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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}