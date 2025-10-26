// src/app/(marketing)/pricing/page.tsx
export const metadata = {
  title: "Pricing – Multi-Tenant AI SaaS",
};

function PlanCard({
  name,
  price,
  features,
  ctaHref,
  highlighted = false,
}: {
  name: string;
  price: string;
  features: string[];
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        highlighted
          ? "border-slate-900/10 dark:border-slate-100/10"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className="mt-6 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        Get started
      </a>
    </div>
  );
}

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Pricing</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Start free. Upgrade when ready.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PlanCard
          name="Free"
          price="$0"
          features={[
            "1 organization",
            "Up to 10 AI generations / month",
            "Community support",
          ]}
          ctaHref="/sign-in"
        />
        <PlanCard
          name="Pro"
          price="$19 / mo"
          features={[
            "Unlimited generations",
            "Priority webhooks",
            "Role-based access",
          ]}
          ctaHref="/sign-in"
          highlighted
        />
        <PlanCard
          name="Enterprise"
          price="Contact us"
          features={[
            "SAML/SSO",
            "Custom limits & SLAs",
            "Dedicated support",
          ]}
          ctaHref="/sign-in"
        />
      </div>
    </section>
  );
}
