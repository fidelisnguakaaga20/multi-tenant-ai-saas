// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

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
          {/* /// Added global navbar so auth menu (including Sign Out) shows on both desktop & mobile */}
          <Navbar />
          <main className="min-h-[calc(100vh-120px)]">{children}</main>
          {/* /// Added global footer */}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
