# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-07-26

### Added
- `redirectToRenewal()` on `useBillingRedirect()` and the Crovver context — sends a subscription that must be paid again to the portal's renewal page.
- `renewal` on the subscription status: `{ supported, method, providers? }`, where `method` is `gateway` | `stripe_update` | `resubscribe` | `null`. Only the `gateway` path is verified end-to-end so far.

### Changed
- `Paywall` and `SubscriptionGate` route their inactive-state CTA by `renewal.method`, so a subscription needing re-payment goes to renewal instead of checkout. `useFeatureAccess` still uses checkout — a feature upgrade is a plan change, not a renewal.

## [1.6.0] - 2026-06-04

### Added
- `productSlug` option on `redirectToCheckout` — scopes the pricing portal to plans belonging to a single product. Pass the product's slug and only that product's plans will be shown on the pricing page. Useful for multi-product orgs where different parts of the app should redirect to different plan sets.

## [1.0.0] - 2026-03-29

### Added
- Initial release of `crovver-react` SDK
- `CrovverProvider` — root provider for managing subscription state
- `useSubscription` hook — access subscription status and plan details
- `useFeatureAccess` hook — check feature-level access (local and remote)
- `useBillingRedirect` hook — redirect to checkout or billing portal
- `Paywall` component — block content behind subscription wall
- `FeatureGuard` component — conditionally render based on feature access
- `SubscriptionGate` component — full-page subscription gate with Tailwind UI
- `SubscriptionBadge` component — display current subscription status
- `CrovverApiClient` — low-level API client for advanced usage
- Full TypeScript support with exported types
- Support for React 18 and 19
- Optional subscription polling
- Debug logging mode
- `onUnauthenticated` callback support
- Metadata passthrough for checkout and portal token requests
