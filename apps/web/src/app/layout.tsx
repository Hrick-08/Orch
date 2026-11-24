import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchestrator — Multi-Model AI Conversation Handoff",
  description:
    "One conversation, every assistant. Continue across ChatGPT, Claude, and Gemini without losing context. Local-first, no server history.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
