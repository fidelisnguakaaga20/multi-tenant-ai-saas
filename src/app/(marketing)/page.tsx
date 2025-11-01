// src/app/(marketing)/page.tsx
import Link from "next/link";

export default function MarketingHomePage() {
  return (
    <section className="bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Workspaces for AI-powered teams
          </h1>
          <p className="text-base text-slate-300">
            Separate orgs, role-based access, monthly usage limits, and Stripe
            billing — all ready to deploy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-transparent bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black"
            >
              View Pricing
            </Link>
          </div>

          <p className="text-xs text-slate-500">Welcome ✅</p>
        </div>

        {/* quick feature rows */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Org-based", "Each user gets a workspace with members & roles."],
            ["Usage limits", "Free = 10/mo. PRO = unlimited."],
            ["Stripe ready", "Checkout, webhooks, plan badge & gating."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5"
            >
              <div className="text-sm font-semibold">{title}</div>
              <div className="mt-1 text-xs text-slate-300">{desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/dashboard/ai"
            className="inline-block rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
          >
            Try the AI demo →
          </Link>
        </div>
      </div>
    </section>
  );
}
