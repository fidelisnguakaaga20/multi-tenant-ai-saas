// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(user.id);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active org" },
      { status: 400 },
    );
  }

  const clients = await prisma.client.findMany({
    where: { orgId: ctx.org.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(user.id);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active org" },
      { status: 400 },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  let name: string;
  let company: string | null = null;
  let contactEmail: string | null = null;
  let estimatedValue: number | null = null;
  let notes: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    name = (body.name ?? "").toString();
    company = body.company ?? null;
    contactEmail = body.contactEmail ?? null;
    estimatedValue =
      body.estimatedValue != null ? Number(body.estimatedValue) : null;
    notes = body.notes ?? null;
  } else {
    const formData = await req.formData();
    name = String(formData.get("name") || "");
    company = (formData.get("company") as string) || null;
    contactEmail = (formData.get("contactEmail") as string) || null;
    const est = formData.get("estimatedValue") as string | null;
    estimatedValue = est ? Number(est) : null;
    notes = (formData.get("notes") as string) || null;
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await prisma.client.create({
    data: {
      orgId: ctx.org.id,
      name,
      company,
      contactEmail,
      estimatedValue,
      notes,
    },
  });

  const url = new URL("/dashboard", req.url);
  return NextResponse.redirect(url);
}
