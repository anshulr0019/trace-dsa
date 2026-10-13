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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("trace:theme");var r=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t==="light"?"light":"dark";document.documentElement.dataset.theme=r;document.documentElement.classList.toggle("dark",r==="dark");document.documentElement.style.colorScheme=r}catch(e){}',
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
