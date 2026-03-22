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

/**
 * Hook to access Crovver context
 * Must be used within CrovverProvider
 */
export function useCrovverContext(): CrovverContextValue {
  const context = useContext(CrovverContext);

  if (!context) {
    throw new Error("useCrovverContext must be used within a CrovverProvider");
  }

  return context;
}
