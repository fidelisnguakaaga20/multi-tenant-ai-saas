import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import Link from "next/link";

const FREE_LIMIT = 10;

export default async function DashboardPage() {
  // 1) Auth
  const user = await currentUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="text-red-400 font-medium">
          Not signed in.
        </div>
      </main>
    );
  }

  const clerkUserId = user.id;
  const email =
    user.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = user.firstName ?? "My";

  // 2) Find or create org membership
  let membership: any = (await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: { org: { include: { subscription: true } } },
    orderBy: { createdAt: "asc" },
  })) as any;

  if (!membership) {
    const db: any = prisma; // bypass TS "no prisma.org" on Vercel

    const newOrg = await db.org.create({
      data: {
        name: `${firstName.toUpperCase()} Workspace`,
        users: {
          create: {
            user: {
              create: {
                clerkUserId,
                email,
              },
            },
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            plan: "FREE",
          },
        },
      },
      include: { subscription: true },
    });

    membership = {
      orgId: newOrg.id,
      org: newOrg,
    } as any;
  }

  const orgId: string = membership.orgId;
  const plan: string = membership.org?.subscription?.plan ?? "FREE";

  // 3) Usage for this org
  const used = await getUsage(orgId);

  const remaining =
    plan === "PRO"
      ? "unlimited"
      : `${Math.max(FREE_LIMIT - used, 0)} left this month`;

  // 4) UI (dark, like your screenshot)
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Dashboard ·{" "}
          <span className="uppercase">
            {firstName} Workspace
          </span>
        </h1>

        <div className="border border-gray-500 rounded-full px-3 py-1 text-xs font-medium">
          Plan: {plan}
        </div>
      </div>

      <section className="border border-gray-600 rounded-xl p-4 max-w-xl space-y-3 bg-black/40">
        <div className="flex items-start gap-2">
          <div className="text-green-400 text-xl leading-none">▣</div>
          <div className="text-sm leading-relaxed">
            <div className="font-semibold text-green-400">
              {plan === "PRO"
                ? "PRO active — unlimited generations."
                : "FREE plan — limited monthly generations."}
            </div>
            <div className="text-gray-300 text-sm mt-1">
              This month used:{" "}
              <span className="font-semibold">{used}</span>
              {plan === "PRO" ? "." : ` (${remaining})`}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/ai"
            className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
          >
            Open AI demo
          </Link>

          <Link
            href="/dashboard/settings"
            className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
          >
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}
