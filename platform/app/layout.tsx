import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trace — Understand the algorithm",
  description:
    "Learn algorithms by exploring real execution, comparing approaches, and testing your understanding.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
