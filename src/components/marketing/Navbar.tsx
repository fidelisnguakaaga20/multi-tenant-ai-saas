// src/components/marketing/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/60 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold text-white">
          Multi-Tenant AI SaaS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm ${
                pathname === item.href
                  ? "font-semibold text-slate-100"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* If signed OUT, show CTA button */}
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
            >
              Sign in
            </Link>
          </SignedOut>

          {/* If signed IN, show Clerk's user menu */}
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </nav>

        {/* Mobile menu button */}
        <button
          className="rounded-md border border-slate-700 px-2 py-1 text-sm text-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Menu"
        >
          Menu
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-slate-800 pb-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  pathname === item.href
                    ? "font-semibold text-slate-100"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
              >
                Sign in
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                  afterSignOutUrl="/"
                />
                <span className="text-sm text-slate-100">Account</span>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}
