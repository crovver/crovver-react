# Crovver React SDK

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official React SDK for integrating [Crovver](https://crovver.com) subscription management into your React application.

**No backend setup required.** The SDK uses your public API key to communicate with Crovver directly from the browser.

## Features

- Zero-backend-setup checkout via public key authentication
- TypeScript support with full type definitions
- React hooks API (`useSubscription`, `useFeatureAccess`, `useBillingRedirect`)
- Pre-built paywall and feature-gating components
- Works with Next.js, Vite, CRA, and any React app

## Installation

```bash
npm install @crovver/react-sdk
# or
yarn add @crovver/react-sdk
# or
pnpm add @crovver/react-sdk
```

## Quick Start

### 1. Wrap Your App

```tsx
import { CrovverProvider } from "@crovver/react-sdk";

function App() {
  return (
    <CrovverProvider
      config={{
        publicKey: "pk_live_xxx", // Your Crovver public API key
        tenantId: "your-org-id", // The current customer's ID in your system
        userId: "your-user-id", // The logged-in user's ID in your system
        apiUrl: "https://api.crovver.com", // Your Crovver API URL
        portalUrl: "https://portal.crovver.com", // Crovver portal URL
      }}
    >
      <YourApp />
    </CrovverProvider>
  );
}
```

`tenantId` is the ID you use in your own system to identify the customer (user ID, org ID, workspace ID, etc.).

### 2. Gate Subscription Access

Use `<Paywall>` to protect entire pages or routes. It automatically redirects to checkout if there is no active subscription:

```tsx
import { Paywall } from "@crovver/react-sdk";

function Dashboard() {
  return (
    <Paywall>
      <DashboardContent />
    </Paywall>
  );
}
```

### 3. Gate Individual Features

```tsx
import { useFeatureAccess } from "@crovver/react-sdk";

function AnalyticsPage() {
  const { hasAccess, isLoading, redirectToUpgrade } =
    useFeatureAccess("advanced-analytics");

  if (isLoading) return <Spinner />;

  if (!hasAccess) {
    return (
      <div>
        <h2>Advanced Analytics is a premium feature</h2>
        <button onClick={redirectToUpgrade}>Upgrade your plan</button>
      </div>
    );
  }

  return <AdvancedAnalytics />;
}
```

## How Checkout Works

When `redirectToCheckout()` is called (by a component or hook), the SDK:

1. Calls `POST {apiUrl}/api/public/auth/checkout-token` with the `x-public-key` header
2. Crovver validates the key, lazily creates the tenant if it doesn't exist, and returns a signed JWT
3. The user is redirected to `{ecomUrl}/pricing?token={jwt}` to complete checkout
4. After checkout, the user is returned to the `returnUrl` (defaults to `window.location.href`)

The public key is safe to use in the browser — it cannot modify subscriptions or access private data.

## API Reference

### `CrovverProvider`

Root provider. Wrap your app (or the section that needs subscription awareness) with this.

```tsx
<CrovverProvider
  config={{
    publicKey: string;       // Required. Starts with pk_live_ or pk_test_
    tenantId: string;        // Required. Your customer's ID in your system
    userId: string;          // Recommended. Stable user ID for deduplicating records
    pollInterval?: number;   // Optional. Auto-refresh interval in ms
    debug?: boolean;         // Optional. Logs SDK activity to console
    onUnauthenticated?: () => void;  // Optional. Called when subscription is inactive
    metadata?: {             // Optional. Extra context for checkout/portal tokens
      userEmail?: string;
      userName?: string;
    };
  }}
>
  {children}
</CrovverProvider>
```

**`userId`** is the ID of the currently logged-in user in your system. It is used by Crovver to deduplicate `tenant_owner` records across checkout sessions. Pass it at the top level — `metadata.userId` still works but is deprecated.

---

### `<Paywall>`

Blocks content behind an active subscription check. Auto-redirects to checkout by default.

```tsx
// Default: shows built-in paywall UI and auto-redirects to checkout
<Paywall>
  <ProtectedContent />
</Paywall>

// Custom fallback UI
<Paywall
  autoRedirect={false}
  fallback={(redirectToCheckout) => (
    <MyUpgradeCard onUpgrade={redirectToCheckout} />
  )}
>
  <ProtectedContent />
</Paywall>
```

| Prop               | Type                                  | Default          | Description                                    |
| ------------------ | ------------------------------------- | ---------------- | ---------------------------------------------- |
| `autoRedirect`     | `boolean`                             | `true`           | Auto-redirect to checkout when no subscription |
| `fallback`         | `(redirect: () => void) => ReactNode` | Built-in UI      | Custom paywall UI                              |
| `loadingComponent` | `ReactNode`                           | Built-in spinner | Custom loading UI                              |
| `style`            | `CSSProperties`                       | —                | Override default card styles                   |

---

### `<SubscriptionGate>`

Similar to `<Paywall>` but Tailwind-styled. Shows a hard block or soft overlay.

```tsx
<SubscriptionGate showSoftPaywall={false}>
  <ProtectedContent />
</SubscriptionGate>
```

---

### `<FeatureGuard>`

Conditionally renders children based on whether the tenant's plan includes a feature.

```tsx
<FeatureGuard
  feature="advanced-analytics"
  fallback={<UpgradePrompt />}
  checkRemote={false}
>
  <AdvancedAnalytics />
</FeatureGuard>
```

| Prop               | Type        | Default | Description                               |
| ------------------ | ----------- | ------- | ----------------------------------------- |
| `feature`          | `string`    | —       | Feature key to check                      |
| `fallback`         | `ReactNode` | `null`  | Rendered when access is denied            |
| `checkRemote`      | `boolean`   | `false` | Verify via API instead of local plan data |
| `loadingComponent` | `ReactNode` | `null`  | Shown while checking                      |

---

### `<PremiumFeature>`

Like `FeatureGuard` but includes a built-in upgrade prompt with an "Upgrade Now" button.

```tsx
<PremiumFeature feature="advanced-analytics" featureName="Advanced Analytics">
  <AdvancedAnalytics />
</PremiumFeature>
```

---

### `useSubscription()`

Access the tenant's current subscription state.

```tsx
const {
  subscription, // Full subscription object (or null)
  isLoading, // true while fetching
  error, // Error object if fetch failed
  isActive, // true if status is active or trialing
  plan, // Current plan details (or null)
  tenant, // Tenant details
  subscriptionDetails, // Raw subscription row
  refresh, // () => Promise<void> — re-fetch
} = useSubscription();
```

**`subscription.status` values:**

| Status     | Meaning                       |
| ---------- | ----------------------------- |
| `active`   | Paid and current              |
| `trialing` | In free trial                 |
| `past_due` | Payment failed, grace period  |
| `canceled` | Explicitly canceled           |
| `expired`  | Trial or subscription expired |
| `none`     | No subscription found         |

---

### `useFeatureAccess(feature, checkRemote?)`

Check if the tenant's plan includes a specific feature.

```tsx
const {
  hasAccess, // true if feature is in the current plan
  canAccess, // alias for hasAccess
  isLoading,
  error,
  redirectToUpgrade, // redirects to checkout with requiredFeature hint
  refresh,
} = useFeatureAccess("advanced-analytics");
```

By default (`checkRemote = false`), the check is done locally against the plan features loaded by `CrovverProvider`. Set `checkRemote = true` to verify via `GET /api/public/features/check`.

---

### `useBillingRedirect()`

Trigger billing-related redirects manually.

```tsx
const {
  redirectToCheckout, // (options?) => void
  redirectToBilling, // () => void — opens billing portal
  isRedirecting, // true while redirect is in progress
} = useBillingRedirect();

// Go to checkout, hinting which plan/feature is needed
redirectToCheckout({ requiredFeature: "advanced-analytics" });
redirectToCheckout({ requiredPlan: "pro" });
```

---

### `useCrovverContext()`

Low-level hook for direct context access. Use the higher-level hooks where possible.

```tsx
const {
  config,
  subscription,
  isLoading,
  error,
  isActive,
  hasFeature,
  checkFeatureAccess,
  redirectToCheckout,
  refreshSubscription,
} = useCrovverContext();
```

---

## Examples

### Dashboard with Subscription Check

```tsx
import { useSubscription } from "@crovver/react-sdk";

function Dashboard() {
  const { isLoading, isActive, plan } = useSubscription();

  if (isLoading) return <LoadingSpinner />;
  if (!isActive) return <PaywallMessage />;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Current Plan: {plan?.name}</p>
      <DashboardContent />
    </div>
  );
}
```

### Multiple Feature Checks

```tsx
import { useFeatureAccess } from "@crovver/react-sdk";

function ExportButton() {
  const pdfExport = useFeatureAccess("pdf-export");
  const csvExport = useFeatureAccess("csv-export");

  if (pdfExport.isLoading || csvExport.isLoading) return <Spinner />;

  return (
    <div>
      {pdfExport.hasAccess && (
        <button onClick={handlePDFExport}>Export PDF</button>
      )}
      {csvExport.hasAccess && (
        <button onClick={handleCSVExport}>Export CSV</button>
      )}
      {!pdfExport.hasAccess && !csvExport.hasAccess && (
        <button onClick={pdfExport.redirectToUpgrade}>
          Upgrade for Export
        </button>
      )}
    </div>
  );
}
```

### Seat-Based Plan Info

```tsx
import { useSubscription } from "@crovver/react-sdk";

function SeatUsage() {
  const { subscriptionDetails, plan } = useSubscription();

  if (!plan?.isSeatBased) return null;

  return (
    <p>
      {subscriptionDetails?.usedCapacity} / {subscriptionDetails?.capacityUnits}{" "}
      seats used
    </p>
  );
}
```

---

## Framework-Specific Setup

### Next.js (App Router)

```tsx
// app/providers.tsx
"use client";
import { CrovverProvider } from "@crovver/react-sdk";

export function Providers({
  children,
  tenantId,
  userId,
}: {
  children: React.ReactNode;
  tenantId: string;
  userId: string;
}) {
  return (
    <CrovverProvider
      config={{
        publicKey: process.env.NEXT_PUBLIC_CROVVER_PUBLIC_KEY!,
        tenantId,
        userId,
      }}
    >
      {children}
    </CrovverProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default async function RootLayout({ children }) {
  const session = await getSession(); // your auth
  return (
    <html>
      <body>
        <Providers tenantId={session.orgId} userId={session.userId}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Vite

```tsx
// main.tsx
import { CrovverProvider } from "@crovver/react-sdk";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <CrovverProvider
    config={{
      publicKey: import.meta.env.VITE_CROVVER_PUBLIC_KEY,
      tenantId: currentUser.orgId,
      userId: currentUser.id,
    }}
  >
    <App />
  </CrovverProvider>
);
```

---

## Environment Variables

Only public-facing keys are needed in the frontend:

```env
# Next.js (.env.local)
NEXT_PUBLIC_CROVVER_PUBLIC_KEY=pk_live_xxx
NEXT_PUBLIC_CROVVER_API_URL=https://api.crovver.com
NEXT_PUBLIC_ECOM_URL=https://ecom.crovver.com

# Vite (.env)
VITE_CROVVER_PUBLIC_KEY=pk_live_xxx
VITE_CROVVER_API_URL=https://api.crovver.com
VITE_ECOM_URL=https://ecom.crovver.com
```

> The private/secret key (`sk_live_xxx`) is only used server-side with the Crovver Node SDK. Never include it in frontend code.

---

## TypeScript Support

```tsx
import type {
  CrovverConfig,
  SubscriptionStatus,
  FeatureAccessResult,
  ApiResponse,
} from "@crovver/react-sdk";
```

---

## FAQs

**Q: Is the public key safe to expose in the frontend?**
Yes. Public keys (`pk_live_xxx`) are read-only — they can check subscription status and initiate checkout redirects, but cannot modify subscriptions or access private data.

**Q: Does the SDK require a backend?**
No. The SDK calls Crovver's API directly using your public key. No token proxy or backend middleware is needed.

**Q: How often is subscription data refreshed?**
Once on mount. Call `refresh()` to update manually, or set `pollInterval` (in ms) on `CrovverProvider` to auto-refresh.

**Q: What if the tenant doesn't exist yet?**
The first time `redirectToCheckout()` is called, Crovver automatically creates the tenant under your organization. Nothing needs to be pre-created.

---

## License

MIT © [Crovver](https://crovver.com)

## Support

- Email: support@crovver.com
- Docs: https://docs.crovver.com
