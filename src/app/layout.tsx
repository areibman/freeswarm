import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeSwarm - Multi-Agent PR Management Simplified",
  description: "Auto-host deployments for every pull request. Streamline your multi-agent development workflow with instant visual feedback.",
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
