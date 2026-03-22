/**
 * Crovver React SDK
 * Official React SDK for Crovver subscription management platform
 */

// Provider & Context
export { CrovverProvider } from "./context/CrovverProvider";
export type { CrovverProviderProps } from "./context/CrovverProvider";
export { useCrovverContext } from "./context/CrovverContext";
export type { CrovverContextValue } from "./context/CrovverContext";

// Hooks
export { useSubscription } from "./hooks/useSubscription";
export type { UseSubscriptionReturn } from "./hooks/useSubscription";

export { useFeatureAccess } from "./hooks/useFeatureAccess";
export type { UseFeatureAccessReturn } from "./hooks/useFeatureAccess";

export { useBillingRedirect } from "./hooks/useBillingRedirect";
export type { UseBillingRedirectReturn } from "./hooks/useBillingRedirect";

// Components
export { Paywall } from "./components/Paywall";
export type { PaywallProps } from "./components/Paywall";

export { FeatureGuard } from "./components/FeatureGuard";
export type { FeatureGuardProps } from "./components/FeatureGuard";


export {
  SubscriptionGate,
  SubscriptionBadge,
} from "./components/SubscriptionGate";

// Types
export type {
  CrovverConfig,
  SubscriptionStatus,
  FeatureAccessResult,
  CheckoutTokenRequest,
  CheckoutTokenResponse,
  PortalTokenResponse,
  CrovverError,
  ApiResponse,
} from "./types";

// API Client (advanced use cases)
export { CrovverApiClient } from "./api";

// Config defaults
export { CROVVER_URL } from "./config";
