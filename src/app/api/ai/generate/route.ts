// src/app/api/ai/generate/route.ts
import { NextRequest } from "next/server";
import { getCurrentOrgForUser } from "@/lib/org";
import { checkAllowance, incrementUsage } from "@/lib/usage";

export async function POST(req: NextRequest) {
  const org = await getCurrentOrgForUser();
  if (!org) return new Response("No org", { status: 400 });

  const { allowed, remaining } = await checkAllowance(org.orgId);
  if (!allowed) return new Response("Free limit reached. Upgrade to PRO.", { status: 402 });

  // NOTE: Real AI call comes in Stage 7. For now, simulate.
  await incrementUsage(org.orgId, 1);
  return Response.json({
    ok: true,
    orgId: org.orgId,
    output: "Demo output (AI stub).",
    remaining: remaining - 1,
  });
}
