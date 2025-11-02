// src/app/(dashboard)/dashboard/page.tsx
// @ts-nocheck
"use server";

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma, dbPing } from "@/lib/db"; // /// import dbPing for fast-fail
import { getUsage } from "@/lib/usage";

const FREE_LIMIT = 10;

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-red-400 font-medium text-sm">Not signed in.</div>
      </main>
    );
  }

  // /// DB health check (saves ~30s hangs if connection is off)
  if (!(await dbPing())) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-yellow-300 text-sm">
          Database is unreachable. Check DATABASE_URL (use -pooler & pgbouncer=true).
        </div>
      </main>
    );
  }

  const clerkUserId = user.id;
  const email = user.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = user.firstName ?? "My";

  // find/create org + subscription (owner by default)
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
          memberships: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // /// Create org + owner membership + FREE sub on first visit
    const newOrg = await prisma.organization.create({
      data: {
        name: `${firstName.toUpperCase()} Workspace`,
        memberships: {
          create: {
            role: "OWNER",
            user: { create: { clerkUserId, email } },
          },
        },
        subscription: { create: { plan: "FREE" } },
      },
      include: {
        subscription: true,
        memberships: { include: { user: true } },
      },
    });

    membership = { orgId: newOrg.id, org: newOrg, role: "OWNER" };
  }

  const org = membership.org!;
  const plan = org.subscription?.plan ?? "FREE";

  // /// Usage after we know org id
  const used = await getUsage(org.id);
  const remainingText =
    plan === "PRO"
      ? "unlimited"
      : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              Dashboard · <span className="uppercase">{org.name}</span>
            </h1>
            <p className="text-xs text-slate-400">
              Usage, members, and quick actions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-medium">
              Plan: {plan}
            </span>
            {/* /// Back to homepage */}
            <Link
              href="/"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Usage card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="text-sm">
            <div>
              This month used:{" "}
              <span className="font-semibold text-white">{used}</span>{" "}
              {plan === "PRO" ? (
                <span className="text-green-400">(unlimited)</span>
              ) : (
                <span className="text-yellow-300">({remainingText})</span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Free limit is {FREE_LIMIT}/month per organization.
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/ai"
              className="rounded-lg border border-slate-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
            >
              Open AI demo
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
            >
              Upgrade to PRO
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
            >
              Settings
            </Link>
          </div>
        </section>

        {/* Members card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="text-sm font-semibold mb-3">Members</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {org.memberships.map((m: any) => (
              <div
                key={m.id}
                className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm flex items-center justify-between"
              >
                <span className="text-slate-200">
                  {m.user?.email ?? "unknown"}
                </span>
                <span className="text-xs rounded-full border border-slate-600 px-2 py-0.5">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Invite flow available at <code>/dashboard/settings</code>.
          </div>
        </section>
      </div>
    </main>
  );
}



// // src/app/(dashboard)/dashboard/page.tsx
// // @ts-nocheck
// "use server";

// import Link from "next/link";
// import { currentUser } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/db";
// import { getUsage } from "@/lib/usage";

// const FREE_LIMIT = 10;

// export default async function DashboardPage() {
//   const user = await currentUser();
//   if (!user) {
//     return (
//       <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
//         <div className="text-red-400 font-medium text-sm">Not signed in.</div>
//       </main>
//     );
//   }

//   const clerkUserId = user.id;
//   const email = user.emailAddresses?.[0]?.emailAddress ?? "unknown";
//   const firstName = user.firstName ?? "My";

//   // find/create org + subscription (owner by default)
//   let membership = await prisma.membership.findFirst({
//     where: { user: { clerkUserId } },
//     include: {
//       org: {
//         include: {
//           subscription: true,
//           memberships: { include: { user: true } },
//         },
//       },
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   if (!membership) {
//     const newOrg = await prisma.organization.create({
//       data: {
//         name: `${firstName.toUpperCase()} Workspace`,
//         memberships: {
//           create: {
//             role: "OWNER",
//             user: { create: { clerkUserId, email } },
//           },
//         },
//         subscription: { create: { plan: "FREE" } },
//       },
//       include: {
//         subscription: true,
//         memberships: { include: { user: true } },
//       },
//     });

//     membership = { orgId: newOrg.id, org: newOrg, role: "OWNER" };
//   }

//   const org = membership.org!;
//   const plan = org.subscription?.plan ?? "FREE";
//   const used = await getUsage(org.id);
//   const remainingText =
//     plan === "PRO"
//       ? "unlimited"
//       : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
//       <div className="max-w-5xl mx-auto space-y-8">
//         {/* Header row */}
//         <div className="flex items-start justify-between flex-wrap gap-4">
//           <div className="space-y-1">
//             <h1 className="text-2xl font-bold">
//               Dashboard · <span className="uppercase">{org.name}</span>
//             </h1>
//             <p className="text-xs text-slate-400">
//               Usage, members, and quick actions.
//             </p>
//           </div>

//           <div className="flex items-center gap-2 flex-wrap">
//             <span className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-medium">
//               Plan: {plan}
//             </span>
//             {/* /// Back to homepage */}
//             <Link
//               href="/"
//               className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
//             >
//               ← Home
//             </Link>
//           </div>
//         </div>

//         {/* Usage card */}
//         <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
//           <div className="text-sm">
//             <div>
//               This month used:{" "}
//               <span className="font-semibold text-white">{used}</span>{" "}
//               {plan === "PRO" ? (
//                 <span className="text-green-400">(unlimited)</span>
//               ) : (
//                 <span className="text-yellow-300">({remainingText})</span>
//               )}
//             </div>
//             <div className="mt-2 text-xs text-slate-400">
//               Free limit is {FREE_LIMIT}/month per organization.
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-3 pt-2">
//             <Link
//               href="/dashboard/ai"
//               className="rounded-lg border border-slate-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
//             >
//               Open AI demo
//             </Link>
//             <Link
//               href="/pricing"
//               className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
//             >
//               Upgrade to PRO
//             </Link>
//             <Link
//               href="/dashboard/settings"
//               className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
//             >
//               Settings
//             </Link>
//           </div>
//         </section>

//         {/* Members card (previously “hidden”) */}
//         <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
//           <div className="text-sm font-semibold mb-3">Members</div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//             {org.memberships.map((m: any) => (
//               <div
//                 key={m.id}
//                 className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm flex items-center justify-between"
//               >
//                 <span className="text-slate-200">
//                   {m.user?.email ?? "unknown"}
//                 </span>
//                 <span className="text-xs rounded-full border border-slate-600 px-2 py-0.5">
//                   {m.role}
//                 </span>
//               </div>
//             ))}
//           </div>
//           <div className="mt-4 text-xs text-slate-400">
//             Invite flow available at <code>/dashboard/settings</code>.
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }
