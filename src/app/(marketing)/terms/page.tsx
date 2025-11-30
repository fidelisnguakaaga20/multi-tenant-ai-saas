// src/app/(marketing)/terms/page.tsx

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Terms of Service</h1>

      <p className="text-sm text-gray-300">
        By using this service, you agree that:
      </p>

      <ul className="text-sm text-gray-400 list-disc pl-6 space-y-2">
        <li>We provide AI assistance on a best-effort basis. No guaranteed uptime.</li>
        <li>You will not use the product for illegal or abusive activity.</li>
        <li>Billing and subscriptions are handled through Stripe. You can cancel.</li>
        <li>Features, limits, and pricing may change as we improve the product.</li>
      </ul>

      <p className="text-xs text-gray-600">
        This is an early access product. Contact support for compliance questions.
      </p>
    </main>
  );
}


