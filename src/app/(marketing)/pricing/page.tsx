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


