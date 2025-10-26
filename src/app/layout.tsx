// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs"; // Clerk root provider :contentReference[oaicite:4]{index=4}

export const metadata: Metadata = {
  title: "Multi-Tenant AI SaaS",
  description: "AI workspace for teams and organizations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
