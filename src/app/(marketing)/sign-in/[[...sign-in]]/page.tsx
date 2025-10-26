// src/app/(marketing)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign in – Multi-Tenant AI SaaS",
};

export default function SignInPage() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SignIn
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        />
      </div>

      <p className="mt-6 text-xs text-slate-600 dark:text-slate-500">
        You’ll be redirected automatically after sign-in.
      </p>
    </section>
  );
}
