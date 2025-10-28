// src/components/marketing/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

// NOTE: "main nav" (top-level product pages)
const navItems = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

// NOTE: "legal nav" (Terms / Privacy) now visible in header on desktop
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

          {/* Divider */}
          <div className="h-4 w-px bg-slate-700" />

          {/* Terms / Privacy visible on desktop */}
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

          {/* Signed-in user menu */}
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
        <div className="border-t border-slate-800 pb-3 md:hidden bg-black">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3">
            {/* main nav items */}
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

            {/* legal links (Terms / Privacy) also visible on mobile */}
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

            <SignedIn>
              <div className="mt-3 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
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



// // src/components/marketing/Navbar.tsx
// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useState } from "react";
// import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

// const navItems = [
//   { href: "/", label: "Home" },
//   { href: "/pricing", label: "Pricing" },
//   { href: "/dashboard", label: "Dashboard" },
// ];

// export default function Navbar() {
//   const pathname = usePathname();
//   const [open, setOpen] = useState(false);

//   return (
//     <header className="border-b border-slate-200/60 dark:border-slate-800">
//       <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
//         <Link href="/" className="text-base font-semibold text-white">
//           Multi-Tenant AI SaaS
//         </Link>

//         {/* Desktop nav */}
//         <nav className="hidden items-center gap-6 md:flex">
//           {navItems.map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`text-sm ${
//                 pathname === item.href
//                   ? "font-semibold text-slate-100"
//                   : "text-slate-400 hover:text-slate-100"
//               }`}
//             >
//               {item.label}
//             </Link>
//           ))}

//           {/* If signed OUT, show CTA button */}
//           <SignedOut>
//             <Link
//               href="/sign-in"
//               className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
//             >
//               Sign in
//             </Link>
//           </SignedOut>

//           {/* If signed IN, show Clerk's user menu */}
//           <SignedIn>
//             <UserButton
//               appearance={{
//                 elements: {
//                   avatarBox: "h-8 w-8",
//                 },
//               }}
//               afterSignOutUrl="/"
//             />
//           </SignedIn>
//         </nav>

//         {/* Mobile menu button */}
//         <button
//           className="rounded-md border border-slate-700 px-2 py-1 text-sm text-slate-100 md:hidden"
//           onClick={() => setOpen((v) => !v)}
//           aria-label="Toggle Menu"
//         >
//           Menu
//         </button>
//       </div>

//       {/* Mobile dropdown */}
//       {open && (
//         <div className="border-t border-slate-800 pb-3 md:hidden">
//           <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3">
//             {navItems.map((item) => (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 onClick={() => setOpen(false)}
//                 className={`rounded-md px-2 py-1.5 text-sm ${
//                   pathname === item.href
//                     ? "font-semibold text-slate-100"
//                     : "text-slate-400 hover:text-slate-100"
//                 }`}
//               >
//                 {item.label}
//               </Link>
//             ))}

//             <SignedOut>
//               <Link
//                 href="/sign-in"
//                 onClick={() => setOpen(false)}
//                 className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
//               >
//                 Sign in
//               </Link>
//             </SignedOut>

//             <SignedIn>
//               <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
//                 <UserButton
//                   appearance={{
//                     elements: {
//                       avatarBox: "h-8 w-8",
//                     },
//                   }}
//                   afterSignOutUrl="/"
//                 />
//                 <span className="text-sm text-slate-100">Account</span>
//               </div>
//             </SignedIn>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// }
