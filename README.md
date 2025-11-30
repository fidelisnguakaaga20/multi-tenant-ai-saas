# Multi-Tenant AI SaaS — AI Proposal Workspace

Production-style **multi-tenant AI proposal workspace** built with  
**Next.js 16 App Router, TypeScript, Prisma, PostgreSQL, Clerk, Stripe, and OpenAI**.

It’s designed to look and feel like a realistic B2B SaaS that a freelancer or agency could use to manage **clients, projects, and AI-generated proposals**.

> 🔗 **Live app:** https://multi-tenant-ai-saas.vercel.app  
> 💻 **Repo:** https://github.com/fidelisnguakaaga20/multi-tenant-ai-saas  

---

## 🧠 What this app does

### Marketing (public)

- `/` – Landing page explaining the product.
- `/pricing` – Free vs Pro plan with upgrade CTA.
- `/terms` & `/privacy` – Basic legal pages.
- `/contact` – Simple contact form.
- `/sign-in`, `/sign-up` – Auth entry points (Clerk).

### App (after login)

- `/dashboard`
  - Shows:
    - Current org plan (Free / Pro).
    - AI usage this month (generations + limits).
    - Billing summary and Stripe upgrade CTA.
    - CRM-style **Projects table** for the current organization.
    - Inline forms to create **Clients** and **Projects**.
    - Simple pipeline snapshot (deals, win rate).
- `/dashboard/ai`
  - AI Copilot for:
    - Client proposals
    - Project scopes
    - Follow-up emails
  - Uses OpenAI to generate content.
  - Each generation counts against org usage.
  - Documents can be saved, edited, deleted.
  - Org-level templates can be created and reused.
- `/dashboard/settings`
  - Workspace info and usage.
  - Member list with roles (`OWNER` / `ADMIN` / `MEMBER`).
  - Invite teammate flow (OWNER / ADMIN only).

### Clients, Projects & Proposals

- **Clients & Projects**
  - Each org has **clients**.
  - Each client has **projects** with:
    - Status: `LEAD | PROPOSAL_SENT | WON | LOST`
    - Estimated value
    - Last activity
- **AI Proposal Builder**
  - Each project has a **Proposal Builder** route:
    - `/dashboard/projects/[projectId]`
    - `/dashboard/projects/[projectId]/proposal`
  - Enter a brief → AI generates structured sections:
    - Overview, Scope, Deliverables, Timeline, Pricing
  - Proposals are versioned and have status:
    - `DRAFT | SENT | ACCEPTED | REJECTED`

### Public proposal links

- Proposals can be “published” to a shareable, read-only URL:
  - Public route: `/p/[publicToken]`
  - Client can open this link without logging in.
  - Public page includes:
    - Proposal title & sections
    - Link back to the main marketing site (`/`)

### Billing & limits (Free vs Pro)

- **Stripe subscription**
  - Upgrade from `/pricing` using Stripe Checkout.
  - Stripe webhook updates the org’s plan to `PRO`.
- **Usage limits**
  - Free:
    - Limited active projects.
    - Limited AI proposal generations per month.
  - Pro:
    - Higher / unlimited limits.
  - Limits enforced in the API layer and surfaced in the UI.

---

## 🧱 Tech stack

- **Frontend**
  - Next.js 16 (App Router)
  - React 19
  - Tailwind-style utility classes
- **Auth & multi-tenancy**
  - Clerk (users, orgs, sessions)
  - Prisma models: `Organization`, `Membership`, `Subscription`
- **Database**
  - PostgreSQL + Prisma ORM
- **Billing**
  - Stripe subscriptions, Checkout, webhooks
- **AI**
  - OpenAI via `openai` SDK
- **Other**
  - Rate limiting middleware
  - TypeScript throughout
  - Deployed to Vercel

---

## 🧬 Data model (high level)

Core Prisma models:

- `User` — App-level user (linked to Clerk user ID).
- `Organization` — Tenant workspace (e.g. an agency).
- `Membership` — User ↔ Org with a `Role` (`OWNER`, `ADMIN`, `MEMBER`).
- `Subscription` — Stripe-backed Free / Pro plan per org.
- `UsageRecord` — Monthly AI usage per org.
- `Client` — CRM client owned by an organization.
- `Project` — Project under a client (status, value, owner, activity).
- `Proposal` — Versioned AI-assisted proposals per project.
- `Document` / `Template` — Saved AI outputs and reusable templates.

Full schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma).

---

## 📂 Project structure (high level)

```text
prisma/
  schema.prisma
  migrations/

src/
  app/
    (marketing)/
      page.tsx                      # Landing
      pricing/page.tsx
      privacy/page.tsx
      terms/page.tsx
      contact/page.tsx
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
    (dashboard)/
      dashboard/page.tsx            # Main dashboard
      dashboard/ai/page.tsx
      dashboard/settings/page.tsx
      dashboard/projects/[projectId]/page.tsx
      dashboard/projects/[projectId]/proposal/page.tsx
    api/
      ai/generate/route.ts
      documents/route.ts
      documents/[id]/route.ts
      org/invite/route.ts
      billing/checkout/route.ts
      billing/portal/route.ts
      webhooks/stripe/route.ts
      clients/route.ts
      projects/route.ts
      projects/[id]/route.ts
      proposals/route.ts
      proposals/[id]/route.ts
      proposals/[id]/publish/route.ts
      proposals/generate/route.ts
      templates/route.ts
      templates/[id]/route.ts
    p/
      [publicToken]/page.tsx        # Public proposal view
  components/
    marketing/Navbar.tsx
    marketing/Footer.tsx
    dashboard/UpgradeButton.tsx
  lib/
    db.ts
    org.ts
    orgAccess.ts
    stripe.ts
    usage.ts
    logger.ts
middleware/
  rateLimit.ts
