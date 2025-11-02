

// src/app/(marketing)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Sign up – Multi-Tenant AI SaaS",
};

export default function SignUpPage() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4">
        <SignUp
          afterSignUpUrl="/dashboard"
          afterSignInUrl="/dashboard"
        />
      </div>
      <p className="mt-6 text-xs text-slate-600 dark:text-slate-500">
        You’ll be redirected automatically after sign-up.
      </p>
    </section>
  );
}
