import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PR Manager - Agent Competition Tracker",
  description: "Track and manage pull requests from competing AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
