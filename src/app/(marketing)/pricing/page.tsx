// src/app/(marketing)/pricing/page.tsx
import UpgradeButton from "@/components/dashboard/UpgradeButton";

export default function PricingPage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-bold">Pricing</h1>
      <p className="text-gray-400">Start free. Upgrade when ready.</p>

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <p className="text-3xl font-bold mb-6">$0</p>
          <ul className="text-sm space-y-2 mb-6">
            <li>• 1 organization</li>
            <li>• Up to 10 AI generations / month</li>
            <li>• Community support</li>
          </ul>
          <a href="/dashboard" className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            Get started
          </a>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <p className="text-3xl font-bold mb-6">$19 / mo</p>
          <ul className="text-sm space-y-2 mb-6">
            <li>• Unlimited generations</li>
            <li>• Priority webhooks</li>
            <li>• Role-based access</li>
          </ul>
          {/* This calls POST /api/billing/checkout and redirects to Stripe */}
          <UpgradeButton />
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
          <p className="text-3xl font-bold mb-6">Contact us</p>
          <ul className="text-sm space-y-2 mb-6">
            <li>• SAML/SSO</li>
            <li>• Custom limits &amp; SLAs</li>
            <li>• Dedicated support</li>
          </ul>
          <a href="/contact" className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            Get started
          </a>
        </div>
      </div>
    </main>
  );
}



// // src/app/(marketing)/pricing/page.tsx
// export const metadata = {
//   title: "Pricing – Multi-Tenant AI SaaS",
// };

// function PlanCard({
//   name,
//   price,
//   features,
//   ctaHref,
//   highlighted = false,
// }: {
//   name: string;
//   price: string;
//   features: string[];
//   ctaHref: string;
//   highlighted?: boolean;
// }) {
//   return (
//     <div
//       className={`rounded-2xl border p-6 shadow-sm ${
//         highlighted
//           ? "border-slate-900/10 dark:border-slate-100/10"
//           : "border-slate-200 dark:border-slate-800"
//       }`}
//     >
//       <h3 className="text-lg font-semibold">{name}</h3>
//       <p className="mt-2 text-3xl font-bold">{price}</p>
//       <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
//         {features.map((f) => (
//           <li key={f}>• {f}</li>
//         ))}
//       </ul>
//       <a
//         href={ctaHref}
//         className="mt-6 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
//       >
//         Get started
//       </a>
//     </div>
//   );
// }

// export default function PricingPage() {
//   return (
//     <section className="mx-auto max-w-6xl px-4 py-16">
//       <header className="text-center">
//         <h1 className="text-3xl font-semibold sm:text-4xl">Pricing</h1>
//         <p className="mt-3 text-slate-600 dark:text-slate-400">
//           Start free. Upgrade when ready.
//         </p>
//       </header>

//       <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//         <PlanCard
//           name="Free"
//           price="$0"
//           features={[
//             "1 organization",
//             "Up to 10 AI generations / month",
//             "Community support",
//           ]}
//           ctaHref="/sign-in"
//         />
//         <PlanCard
//           name="Pro"
//           price="$19 / mo"
//           features={[
//             "Unlimited generations",
//             "Priority webhooks",
//             "Role-based access",
//           ]}
//           ctaHref="/sign-in"
//           highlighted
//         />
//         <PlanCard
//           name="Enterprise"
//           price="Contact us"
//           features={[
//             "SAML/SSO",
//             "Custom limits & SLAs",
//             "Dedicated support",
//           ]}
//           ctaHref="/sign-in"
//         />
//       </div>
//     </section>
//   );
// }
