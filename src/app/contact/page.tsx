// src/app/contact/page.tsx
export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Contact us</h1>
      <p className="text-gray-400">
        Tell us about your team and needs. We’ll get back within 1 business day.
      </p>

      <div className="rounded-xl border p-4 space-y-3">
        <p>Email: <a className="underline" href="mailto:support@example.com">support@example.com</a></p>
        <p>Subject: <code>Enterprise plan inquiry</code></p>
      </div>

      <a href="/pricing" className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
        ← Back to Pricing
      </a>
    </main>
  );
}
