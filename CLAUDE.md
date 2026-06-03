# crovver-react — Codebase Guide

## This Project

The official React SDK for Crovver. Published to npm as `crovver-react`. SaaS frontends install this to gate features behind subscriptions, show paywalls, and redirect users to the billing portal — all without a backend call and using only a public key.

**Language:** TypeScript · **Build tool:** tsup · **Package manager:** pnpm · **Peer deps:** React 18 or 19

### Build
```bash
pnpm build        # tsup → dist/index.js (CJS) + dist/index.mjs (ESM) + types
pnpm build:watch  # watch mode
pnpm type-check   # tsc --noEmit
```

### Structure
```
src/
  index.ts            ← Public exports (re-exports everything below)
  config.ts           ← CROVVER_URL default
  types.ts            ← Shared TypeScript types
  api.ts              ← CrovverApiClient (low-level HTTP, public key auth)
  context/
    CrovverProvider.tsx   ← Wraps app; takes publicKey + portalUrl
    CrovverContext.ts     ← Context value type + useCrovverContext hook
  hooks/
    useSubscription.ts    ← Subscription status, plan, trial info
    useFeatureAccess.ts   ← Feature flag check by key
    useBillingRedirect.ts ← Redirect to portal for checkout or management
  components/
    Paywall.tsx           ← Renders children or upgrade prompt based on feature access
    FeatureGuard.tsx      ← Conditionally renders children if feature is accessible
    SubscriptionGate.tsx  ← SubscriptionGate + SubscriptionBadge components
dist/                 ← Built output (not committed)
```

### Public API (what consumers import)
```typescript
// Provider — wrap your app once
import { CrovverProvider } from 'crovver-react';
<CrovverProvider publicKey="pk_live_..." portalUrl="https://portal.crovver.com">

// Hooks
const { isActive, plan, isTrialing } = useSubscription();
const { canAccess, isLoading } = useFeatureAccess('advanced-analytics');
const { redirectToCheckout, redirectToPortal } = useBillingRedirect();

// Components
<Paywall featureKey="advanced-analytics">...</Paywall>
<FeatureGuard featureKey="exports">...</FeatureGuard>
<SubscriptionGate><PremiumContent /></SubscriptionGate>
```

### Key Design Decisions
- **Public key only** (`pk_live_` / `pk_test_`) — safe to ship in browser bundles; no secret key ever
- **No backend needed** for feature gating — the SDK fetches subscription state directly from crovver-mvp using the public key
- **Checkout via JWT redirect** — `redirectToCheckout()` mints a short-lived token from crovver-mvp then redirects the browser to crovver-portal; no payment credentials touch the frontend

---

## Crovver Ecosystem

Crovver is a **subscription management layer** for SaaS products. It sits between a SaaS app and payment providers (Stripe, Khalti, eSewa), handling subscription state, feature entitlements, seat tracking, usage limits, and hosted checkout — so SaaS teams don't build billing themselves. Payment credentials are never stored in the database; they go through Infisical or Vault.

### Sub-Projects
| Folder | What it is | Port / Registry |
|--------|-----------|-----------------|
| `crovver-mvp` | API server + admin dashboard (Next.js 16) | 3000 |
| `crovver-portal` | Customer-facing billing portal (Next.js 15) | 3002 |
| `crovver-node` | Official Node.js/TypeScript SDK | npm: `crovver-node` |
| `crovver-react` | Official React SDK — **this project** | npm: `crovver-react` |
| `crovver-php` | Official PHP 8.2+ SDK | Packagist: `crovver/crovver-php` |
| `docs` | Mintlify documentation site | — |

### Core Data Model
| Entity | Description |
|--------|-------------|
| **Org** | A SaaS company using Crovver. Type `b2b` = workspace-based customers; `d2c` = individual users |
| **Tenant** | The billing unit — a workspace (B2B) or user (D2C). Identified via `external_tenant_id` |
| **Plan** | Pricing tier with `features` (boolean flags) and `limits` (numeric caps). Flat or seat-based |
| **Subscription** | Tenant ↔ Plan binding. Statuses: pending → trialing → active → past_due → canceled |
| **Entitlement** | `canAccess(tenantId, featureKey)` — checks plan features; trial counts as active |

### API Key Types
- `pk_live_` / `pk_test_` — public keys, safe for browser — **this SDK uses these**
- `sk_live_` / `sk_test_` — secret keys, backend only (Node SDK, PHP SDK)

### Checkout Flow
1. SaaS frontend calls `redirectToCheckout()` — **React SDK starts here**
2. React SDK calls `POST /api/public/auth/checkout-token` on crovver-mvp → gets a short-lived JWT
3. Browser redirects to `{portalUrl}/pricing?token={jwt}`
4. crovver-portal validates JWT, fetches plans, shows plan picker
5. User picks plan → portal calls `POST /api/public/checkout` → Stripe session created
6. Stripe webhook fires → crovver-mvp activates subscription → `useSubscription().isActive === true`
