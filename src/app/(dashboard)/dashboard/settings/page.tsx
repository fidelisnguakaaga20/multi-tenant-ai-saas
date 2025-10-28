// @ts-nocheck

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import Link from "next/link";

const FREE_LIMIT = 10;

export default async function SettingsPage() {
  //
  // 1) Auth
  //
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

  //
  // 2) Load or create membership/org/subscription
  //
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
          memberships: {
            include: {
              user: true, // so we can list member emails
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // New org bootstrap for first-time users
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
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    membership = {
      orgId: newOrg.id,
      org: newOrg,
    };
  }

  const org = membership.org;
  const orgId = org.id;
  const plan = org.subscription?.plan ?? "FREE";

  //
  // 3) Usage stats
  //
  const used = await getUsage(orgId);
  const remainingText =
    plan === "PRO"
      ? "unlimited"
      : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

  //
  // 4) Members list
  //
  const members =
    org.memberships?.map((m: any) => {
      return {
        email: m.user?.email ?? "unknown",
        role: m.role,
      };
    }) ?? [];

  //
  // 5) UI
  //
  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="border border-gray-500 rounded-full px-3 py-1 text-xs font-medium">
          Plan: {plan}
        </div>
      </div>

      {/* Workspace card */}
      <section className="border border-gray-600 rounded-xl p-4 max-w-xl space-y-2 bg-black/40">
        <div className="text-sm font-semibold text-white">
          Workspace
        </div>

        <div className="text-sm text-gray-300">
          <div>
            <span className="font-semibold text-white">
              Name:
            </span>{" "}
            {org.name}
          </div>

          <div className="break-all">
            <span className="font-semibold text-white">
              Org ID:
            </span>{" "}
            {orgId}
          </div>

          <div>
            <span className="font-semibold text-white">
              Usage this month:
            </span>{" "}
            {used}{" "}
            {plan === "PRO" ? (
              <span className="text-green-400">(unlimited)</span>
            ) : (
              <span className="text-yellow-300">
                ({remainingText})
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Members card */}
      <section className="border border-gray-600 rounded-xl p-4 max-w-xl space-y-3 bg-black/40">
        <div className="text-sm font-semibold text-white">
          Members
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          {members.length === 0 && (
            <div className="text-gray-500 italic">
              No members found.
            </div>
          )}

          {members.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between border border-gray-700 rounded px-3 py-2"
            >
              <div className="truncate">{m.email}</div>
              <span className="border border-gray-500 rounded-full text-xs px-2 py-1 font-medium">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
        >
          ← Back
        </Link>

        <Link
          href="/pricing"
          className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
        >
          Upgrade
        </Link>
      </div>
    </main>
  );
}
