// src/components/marketing/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-black text-slate-500 text-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex flex-col items-center gap-2 text-xs text-slate-500 md:flex-row md:gap-4">
          <Link href="/terms" className="hover:text-slate-200 transition-colors">
            Terms
          </Link>
          <Link
            href="/privacy"
            className="hover:text-slate-200 transition-colors"
          >
            Privacy
          </Link>
        </div>

        <div className="text-xs text-slate-600">
          © {year} Multi-Tenant AI SaaS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
