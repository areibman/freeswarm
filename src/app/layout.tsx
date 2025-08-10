import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeSwarm - Auto-Deploy PR Reviews for Multi-Agent Teams",
  description: "Stop fighting agent chaos. FreeSwarm auto-deploys every pull request so your team can review AI agent changes instantly—no local setup required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
