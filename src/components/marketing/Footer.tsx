// src/components/marketing/Footer.tsx
export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 py-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto max-w-6xl px-4">
        © {new Date().getFullYear()} Multi-Tenant AI SaaS. All rights reserved.
      </div>
    </footer>
  );
}
