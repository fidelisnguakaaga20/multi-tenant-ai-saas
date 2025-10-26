import { auth, currentUser } from "@clerk/nextjs/server";
import UpgradeButton from "@/components/dashboard/UpgradeButton";

// TODO Stage 5: actually read plan from Prisma Subscription table using orgId.
// For now we just hardcode "Free".
async function getPlanForNow() {
  return "Free";
}

export default async function DashboardHomePage() {
  const { orgId } = auth();
  const user = await currentUser();

  if (!user) {
    return (
      <main className="p-8">
        <h2 className="text-xl font-semibold">Not signed in</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
          You should have been redirected to /sign-in. Check middleware.
        </p>
      </main>
    );
  }

  const email =
    user.emailAddresses?.[0]?.emailAddress ||
    user.primaryEmailAddress?.emailAddress ||
    "unknown@email";

  const plan = await getPlanForNow();
  const orgText = orgId ? `Org ID: ${orgId}` : "No org selected yet";

  return (
    <main className="p-8 space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Dashboard (protected)</h2>

        <p className="text-slate-300 text-sm mt-2">
          Welcome,{" "}
          <span className="font-medium text-white">{email}</span>
        </p>

        <p className="text-slate-500 text-sm">{orgText}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-white">
              Plan: {plan}
            </div>
            <div className="text-xs text-slate-500">
              Free plan is limited. Pro unlocks higher AI limits.
            </div>
          </div>

          {plan === "Free" && <UpgradeButton />}
        </div>
      </section>

      <section className="text-slate-500 text-xs max-w-xl">
        After you pay, Stripe will call our webhook. We’ll mark your org as
        PRO in the database and this card will show Pro instead of Free.
      </section>
    </main>
  );
}
