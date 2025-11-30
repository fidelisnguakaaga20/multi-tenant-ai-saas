# Multi-Tenant AI SaaS

Full-stack demo of a **multi-tenant AI proposal workspace** built with Next.js 16 App Router, Clerk, Prisma and Stripe.

It is designed to look and feel like a realistic B2B SaaS product that a freelancer / agency could use to manage clients, projects, and AI-generated proposals.

---

## What this app does

### Marketing side (public)

- `/` – Landing page that explains the product.
- `/pricing` – Free vs Pro plan with upgrade CTA.
- `/terms` and `/privacy` – Basic legal pages.
- `/contact` – Simple contact page.
- `/sign-in`, `/sign-up` – Auth entry points for Clerk.

### Application side (after login)

- `/dashboard`
  - Shows:
    - Current org plan (Free / Pro).
    - AI usage this month (generations + limits).
    - Billing summary and link to Stripe customer portal.
    - CRM-style **Projects table** for the current organization.
    - Inline forms to create **Clients** and **Projects**.
    - Simple **pipeline snapshot** (clients, projects, deals, win rate).
    - Members list and roles.
- `/dashboard/ai`
  - AI Copilot for:
    - Client proposals
    - Project scopes
    - Follow-up emails
  - Uses OpenAI to generate content.
  - Each generation counts against org usage.
  - Documents can be saved, edited, and deleted.
  - Templates can be created and reused at org level.
- `/dashboard/settings`
  - Shows workspace info and usage.
  - Member list with roles (OWNER / ADMIN / MEMBER).
  - Invite teammate flow (OWNER/ADMIN only).

### Proposals & sharing

- Internally:
  - Each **Project** can have proposals generated and saved (per Stage 3 in the project plan).
  - Proposals are tied to org + project.
- Public view:
  - Proposals can be “published” to a shareable URL (per Stage 4).
  - Public route (e.g. `/p/[publicToken]`) shows a read-only proposal for clients.
  - Public page includes a link back to the main marketing site.

### Billing & limits

- **Stripe** subscription:
  - Checkout is initiated from `/pricing` / “Upgrade to PRO”.
  - Stripe Checkout passes `orgId` in metadata.
  - Webhook flips the organization’s plan to `PRO`.
- **Free vs Pro behaviour** (Stage 5):
  - Free:
    - AI generations per month: limited (e.g. 10).
    - Projects: limited (e.g. 3).
  - Pro:
    - Higher or unlimited limits.
  - Limits are enforced on the API layer and surfaced in the UI.

---

## Tech stack

- **Frontend**
  - Next.js 16 App Router
  - React Server Components + Client Components
  - Tailwind-style utility classes for styling
- **Auth**
  - [Clerk](https://clerk.com/) for sign-up/sign-in and user sessions
- **Database**
  - PostgreSQL with Prisma ORM
  - Multi-tenant isolation via `Organization` and `Membership` tables
- **Billing**
  - Stripe subscriptions and webhooks
- **AI**
  - OpenAI (Chat Completions API) via `openai` SDK
- **Other**
  - Rate limiting middleware
  - TypeScript throughout
  - Deployed to Vercel (App Router-compatible)

---

## Project structure (high level)

```text
prisma/
  schema.prisma
  migrations/

src/
  app/
    (marketing)/
      page.tsx             # Landing
      pricing/page.tsx
      privacy/page.tsx
      terms/page.tsx
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
      contact/page.tsx
    (dashboard)/
      dashboard/page.tsx   # Main dashboard
      dashboard/ai/page.tsx
      dashboard/settings/page.tsx
      p/[publicToken]/page.tsx   # Public proposal view (Stage 4)
    api/
      ai/generate/route.ts
      documents/route.ts
      documents/[id]/route.ts
      org/invite/route.ts
      billing/checkout/route.ts
      webhooks/stripe/route.ts
      ... (clients, projects, proposals, templates)
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
    ...
middleware/
  rateLimit.ts
