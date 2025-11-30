// src/app/(dashboard)/dashboard/settings/page.tsx
// @ts-nocheck

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import Link from "next/link";
import { InviteMemberForm } from "./InviteMemberForm";

const FREE_LIMIT = 10;

// Map DB role to product-facing role (Stage 5)
function mapDisplayRole(role: string) {
  if (role === "ADMIN") return "MANAGER";
  if (role === "MEMBER") return "CONTRIBUTOR";
  return role;
}

export default async function SettingsPage() {
  // 1) Auth (guarded for Clerk dev hiccups)
  let user: any = null;
  try {
    user = await currentUser();
  } catch {
    // swallow dev hiccup
  }

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

  // 2) Load or create membership/org/subscription
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
          memberships: {
            include: {
              user: true,
            },
          },
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
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    membership = {
      role: "OWNER",
      orgId: newOrg.id,
      org: newOrg,
    };
  }

  const org = membership.org;
  const orgId = org.id;
  const role = membership.role; // OWNER / ADMIN / MEMBER
  const displayRole = mapDisplayRole(role);
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const plan = org.subscription?.plan ?? "FREE";

  // 3) Usage stats
  const used = await getUsage(orgId);
  const remainingText =
    plan === "PRO"
      ? "unlimited"
      : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

  // 4) Members list (mapped to OWNER / MANAGER / CONTRIBUTOR)
  const members =
    org.memberships?.map((m: any) => {
      return {
        email: m.user?.email ?? "unknown",
        role: mapDisplayRole(m.role),
      };
    }) ?? [];

  // 5) UI
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header / badges */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <div className="text-xs text-slate-400">
              Manage workspace, members, and billing.
            </div>
            <div className="text-[11px] text-slate-500">
              Role:{" "}
              <span className="font-medium text-white">{displayRole}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-sm">
              Plan: {plan}
            </div>
            <div className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-[10px] font-medium text-slate-400 break-all">
              Org {orgId}
            </div>
          </div>
        </div>

        {/* Workspace card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-3">
          <div className="text-sm font-semibold text-slate-100">
            Workspace
          </div>

          <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
            <div>
              <span className="font-semibold text-white">Name:</span>{" "}
              {org.name}
            </div>

            <div className="break-all">
              <span className="font-semibold text-white">Org ID:</span>{" "}
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
                <span className="text-yellow-300">({remainingText})</span>
              )}
            </div>
          </div>
        </section>

        {/* Members card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="text-sm font-semibold text-slate-100">
            Members
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            {members.length === 0 && (
              <div className="text-slate-600 italic">
                No members found.
              </div>
            )}

            {members.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2"
              >
                <div className="truncate text-slate-200">{m.email}</div>
                <span className="rounded-full border border-slate-600 bg-slate-800/60 text-[11px] px-2 py-1 font-medium text-slate-100">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Invite teammate (OWNER / MANAGER only via isOwnerOrAdmin) */}
        <InviteMemberForm canInvite={isOwnerOrAdmin} />

        {/* Footer actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black transition-colors"
          >
            ← Back
          </Link>

          <Link
            href="/pricing"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              isOwnerOrAdmin
                ? "border border-slate-600 bg-slate-800/50 text-white hover:bg-white hover:text-black"
                : "border border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed"
            }`}
          >
            Upgrade
          </Link>
        </div>
      </div>
    </main>
  );
}

