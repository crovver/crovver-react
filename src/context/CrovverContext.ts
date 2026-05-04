/**
 * Crovver Context
 * Provides subscription and feature access state to React components
 */

import { createContext, useContext } from "react";
import type { SubscriptionStatus, CrovverConfig } from "../types";
import type { CrovverApiClient } from "../api";

export interface CrovverContextValue {
  // Configuration
  config: CrovverConfig;

  // API Client
  client: CrovverApiClient;

  // Subscription state
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: Error | null;

  // Helper functions
  isActive: boolean;
  hasFeature: (feature: string) => boolean;
  checkFeatureAccess: (feature: string) => Promise<boolean>;
  redirectToCheckout: (options?: {
    requiredFeature?: string;
    requiredPlan?: string;
  }) => void;
  redirectToPortal: () => void;
  refreshSubscription: () => Promise<void>;
}

export const CrovverContext = createContext<CrovverContextValue | null>(null);

const NOOP = () => {};
const NOOP_ASYNC = async () => {};

/** Returned by useCrovverContext when called outside a CrovverProvider. */
const NO_OP_CONTEXT: CrovverContextValue = {
  config: {} as CrovverConfig,
  client: {} as CrovverApiClient,
  subscription: null,
  isLoading: false,
  error: null,
  isActive: false,
  hasFeature: () => false,
  checkFeatureAccess: async () => false,
  redirectToCheckout: NOOP,
  redirectToPortal: NOOP,
  refreshSubscription: NOOP_ASYNC,
};

/**
 * Hook to access Crovver context.
 * Safe to call anywhere in the React tree — returns no-op defaults when used
 * outside a CrovverProvider so components don't need to guard the call site.
 */
export function useCrovverContext(): CrovverContextValue {
  const context = useContext(CrovverContext);

  if (!context) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[crovver-react] useCrovverContext called outside CrovverProvider — " +
          "billing functions will be no-ops until the provider mounts."
      );
    }
    return NO_OP_CONTEXT;
  }

  return context;
}
