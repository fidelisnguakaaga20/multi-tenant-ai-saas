// @ts-nocheck

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import Link from "next/link";

const FREE_LIMIT = 10;

export default async function DashboardPage() {
  //
  // 1) Auth
  //
  const user = await currentUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-red-400 font-medium text-sm">
          Not signed in.
        </div>
      </main>
    );
  }

  const clerkUserId = user.id;
  const email = user.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = user.firstName ?? "My";

  //
  // 2) Find or create membership/org/subscription
  //
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    const newOrg = await prisma.organization.create({
      data: {
        name: `${firstName.toUpperCase()} Workspace`,
        memberships: {
          create: {
            role: "OWNER",
            user: {
              create: {
                clerkUserId,
                email,
              },
            },
          },
        },
        subscription: {
          create: {
            plan: "FREE",
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    membership = {
      orgId: newOrg.id,
      org: newOrg,
    };
  }

  const orgId = membership.orgId;
  const plan = membership.org?.subscription?.plan ?? "FREE";

  //
  // 3) Usage stats
  //
  const used = await getUsage(orgId);

  const remainingText =
    plan === "PRO"
      ? "unlimited"
      : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

  //
  // 4) UI
  //
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">
              Dashboard ·{" "}
              <span className="uppercase">
                {firstName} WORKSPACE
              </span>
            </h1>

            <div className="text-xs text-slate-400">
              Track usage, plan status, and jump into AI.
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-100 shadow-sm">
              Plan: {plan}
            </span>
          </div>
        </div>

        {/* Plan / Usage Card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-100 flex items-start gap-2">
              <div className="text-green-400 text-xl leading-none">▣</div>
              <div>
                {plan === "PRO" ? (
                  <span className="text-green-400">
                    PRO active — unlimited generations.
                  </span>
                ) : (
                  <span className="text-yellow-300">
                    FREE plan — limited monthly generations.
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-slate-300 leading-relaxed">
              <div>
                This month used:{" "}
                <span className="font-semibold text-white">{used}</span>{" "}
                {plan === "PRO" ? (
                  <span className="text-green-400">(unlimited)</span>
                ) : (
                  <span className="text-yellow-300">
                    ({remainingText})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/ai"
              className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black transition-colors"
            >
              Open AI demo
            </Link>

            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black transition-colors"
            >
              Settings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}


// // @ts-nocheck

// import { currentUser } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/db";
// import { getUsage } from "@/lib/usage";
// import Link from "next/link";

// const FREE_LIMIT = 10;

// export default async function DashboardPage() {
//   //
//   // 1) Auth
//   //
//   const user = await currentUser();
//   if (!user) {
//     return (
//       <main className="min-h-screen bg-black text-white p-6">
//         <div className="text-red-400 font-medium">
//           Not signed in.
//         </div>
//       </main>
//     );
//   }

//   const clerkUserId = user.id;
//   const email =
//     user.emailAddresses?.[0]?.emailAddress ?? "unknown";
//   const firstName = user.firstName ?? "My";

//   //
//   // 2) Find or create membership/org/subscription
//   //
//   let membership = await prisma.membership.findFirst({
//     where: { user: { clerkUserId } },
//     include: {
//       org: {
//         include: {
//           subscription: true,
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
//             user: {
//               create: {
//                 clerkUserId,
//                 email,
//               },
//             },
//           },
//         },
//         subscription: {
//           create: {
//             plan: "FREE",
//           },
//         },
//       },
//       include: {
//         subscription: true,
//       },
//     });

//     membership = {
//       orgId: newOrg.id,
//       org: newOrg,
//     };
//   }

//   const orgId = membership.orgId;
//   const plan = membership.org?.subscription?.plan ?? "FREE";

//   //
//   // 3) Usage stats
//   //
//   const used = await getUsage(orgId);

//   const remainingText =
//     plan === "PRO"
//       ? "unlimited"
//       : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

//   //
//   // 4) UI
//   //
//   return (
//     <main className="min-h-screen bg-black text-white p-6">
//       <div className="flex items-start justify-between mb-6">
//         <h1 className="text-2xl font-bold">
//           Dashboard ·{" "}
//           <span className="uppercase">
//             {firstName} WORKSPACE
//           </span>
//         </h1>

//         <div className="border border-gray-500 rounded-full px-3 py-1 text-xs font-medium">
//           Plan: {plan}
//         </div>
//       </div>

//       <section className="border border-gray-600 rounded-xl p-4 max-w-xl space-y-3 bg-black/40">
//         <div className="flex items-start gap-2">
//           <div className="text-green-400 text-xl leading-none">
//             ▣
//           </div>
//           <div className="text-sm leading-relaxed">
//             <div className="font-semibold text-green-400">
//               {plan === "PRO"
//                 ? "PRO active — unlimited generations."
//                 : "FREE plan — limited monthly generations."}
//             </div>

//             <div className="text-gray-300 text-sm mt-1">
//               This month used:{" "}
//               <span className="font-semibold">{used}</span>
//               {plan === "PRO" ? (
//                 <span className="text-green-400">
//                   {" "}
//                   (unlimited)
//                 </span>
//               ) : (
//                 <>
//                   {" "}
//                   (<span className="text-yellow-300">
//                     {remainingText}
//                   </span>
//                   )
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-3 pt-2">
//           <Link
//             href="/dashboard/ai"
//             className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
//           >
//             Open AI demo
//           </Link>

//           <Link
//             href="/dashboard/settings"
//             className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
//           >
//             Settings
//           </Link>
//         </div>
//       </section>
//     </main>
//   );
// }
