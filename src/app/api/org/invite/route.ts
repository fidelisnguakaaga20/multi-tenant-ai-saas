// src/app/api/org/invite/route.ts

// @ts-nocheck
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";

export async function POST(req: Request) {
  // 1. Must be signed in
  const caller = await currentUser();
  if (!caller) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Get caller org + role
  const ctx = await getActiveOrgContext(caller.id);
  if (!ctx.ok) {
    return new Response("No org context", { status: 400 });
  }

  const { org } = ctx;
  if (!org.isOwnerOrAdmin) {
    return new Response(
      "Forbidden (need OWNER or ADMIN)",
      { status: 403 }
    );
  }

  // 3. Read body
  const body = await req.json().catch(() => ({}));
  const inviteEmail =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  if (!inviteEmail) {
    return new Response("Missing email", { status: 400 });
  }

  // 4. Does that email already exist as a User in DB?
  const existingUser = await prisma.user.findFirst({
    where: { email: inviteEmail },
  });

  if (!existingUser) {
    // They haven't logged in yet — can't create a User for them
    // because clerkUserId is required in your schema.
    return new Response(
      JSON.stringify({
        ok: false,
        message:
          "User with that email has not signed in yet. Ask them to sign in first.",
      }),
      { status: 200 }
    );
  }

  // 5. Are they already a member?
  const already = await prisma.membership.findFirst({
    where: {
      userId: existingUser.id,
      orgId: org.id,
    },
  });

  if (already) {
    return new Response(
      JSON.stringify({
        ok: true,
        message: "User is already a member of this org.",
      }),
      { status: 200 }
    );
  }

  // 6. Add them as MEMBER
  await prisma.membership.create({
    data: {
      userId: existingUser.id,
      orgId: org.id,
      role: "MEMBER",
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      message: "User added to org as MEMBER.",
    }),
    { status: 200 }
  );
}
