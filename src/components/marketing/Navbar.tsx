// src/components/marketing/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignOutButton,
} from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

const legalItems = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link
          href="/"
          className="text-base font-semibold text-white hover:text-slate-200"
        >
          Multi-Tenant AI SaaS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? "font-semibold text-slate-100"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="h-4 w-px bg-slate-700" />

          {legalItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs transition-colors ${
                pathname === item.href
                  ? "font-semibold text-slate-300"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Signed-out CTA */}
          <SignedOut>
            <Link
              href="/sign-in"
              className="ml-4 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
            >
              Sign in
            </Link>
          </SignedOut>

          {/* Signed-in user menu (desktop). UserButton includes Sign out in its menu. */}
          <SignedIn>
            <UserButton
              appearance={{ elements: { avatarBox: "h-8 w-8" } }}
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
        <div className="border-t border-slate-800 pb-3 md:hidden bg-black">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                  pathname === item.href
                    ? "font-semibold text-slate-100"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-1 border-t border-slate-800 pt-2">
              {legalItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    pathname === item.href
                      ? "font-semibold text-slate-300"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth zone */}
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="mt-3 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
              >
                Sign in
              </Link>
            </SignedOut>

            {/* /// Explicit mobile Sign Out button so it’s obvious on phones */}
            <SignedIn>
              <div className="mt-3 flex items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
                <div className="flex items-center gap-2">
                  <UserButton
                    appearance={{ elements: { avatarBox: "h-7 w-7" } }}
                    afterSignOutUrl="/"
                  />
                  <span className="text-sm text-slate-100">Account</span>
                </div>
                <SignOutButton redirectUrl="/">
                  <button className="rounded-md border border-slate-600 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-200">
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}
