// src/app/(marketing)/page.tsx
export default function MarketingHomePage() {
  return (
    <section className="flex flex-col items-center justify-center py-24 text-center">
      <div className="max-w-xl space-y-6 px-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Multi-Tenant AI SaaS
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-400">
          Secure AI workspaces for teams. Org-based access, usage limits, and
          Stripe billing — all in one dashboard.
        </p>

        <div className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-slate-700 dark:bg-slate-800">
          Welcome ✅
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-500">
          You’re seeing the Multi Tenant AI SaaS Page.
        </p>
      </div>
    </section>
  );
}
