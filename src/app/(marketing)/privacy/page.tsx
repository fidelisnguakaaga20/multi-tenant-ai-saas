// src/app/(marketing)/privacy/page.tsx

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p className="text-sm text-gray-300">Summary of what we store:</p>

      <ul className="text-sm text-gray-400 list-disc pl-6 space-y-2">
        <li>Your account identity from Clerk (email, Clerk user ID).</li>
        <li>Your organization / workspace membership and role.</li>
        <li>AI usage counts per month so we can enforce the free limit.</li>
        <li>Subscription status (FREE or PRO) linked to Stripe.</li>
        <li>
          The prompts you send to generate AI output may be processed by our AI
          provider.
        </li>
      </ul>

      <p className="text-xs text-gray-600">
        We do not sell your data. For removal or export, contact support.
      </p>
    </main>
  );
}

