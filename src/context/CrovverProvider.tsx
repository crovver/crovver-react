/**
 * Crovver Provider
 * Root component for Crovver React SDK
 */

import { useState, useEffect, useCallback, ReactNode } from "react";
import { CrovverContext } from "./CrovverContext";
import { CrovverApiClient } from "../api";
import type { CrovverConfig, SubscriptionStatus } from "../types";
import { CROVVER_URL } from "../config";

export interface CrovverProviderProps {
  /** Configuration object */
  config: {
    /** Your Crovver public API key (starts with pk_live_ or pk_test_) */
    publicKey: string;
    /** The tenant ID to check subscriptions for */
    tenantId: string;
    /** Crovver API URL (optional, defaults to http://localhost:3000) */
    apiUrl?: string;
    /** E-commerce checkout URL (optional, defaults to http://localhost:3002) */
    portalUrl?: string;
    /** Poll subscription status at this interval in ms (optional, disabled by default) */
    pollInterval?: number;
    /** Enable debug logging (optional, defaults to false) */
    debug?: boolean;
    /** Callback when authentication fails (optional) */
    onUnauthenticated?: () => void;
    /** Stable user ID from the caller for deduplicating tenant_owners records */
    userId?: string;
    /** Metadata to attach to checkout/portal token requests (e.g. org email and name) */
    metadata?: {
      userEmail?: string;
      userName?: string;
      /** @deprecated Pass userId at the top level instead */
      userId?: string;
    };
  };
  children: ReactNode;
}

export function CrovverProvider({ children, config }: CrovverProviderProps) {
  const {
    publicKey,
    tenantId,
    apiUrl = CROVVER_URL.API,
    portalUrl = CROVVER_URL.PORTAL,
    pollInterval,
    debug = false,
    onUnauthenticated,
    userId: userIdProp,
    metadata,
  } = config;

  const userId = userIdProp ?? metadata?.userId;

  // State
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // API Client
  const [client] = useState(
    () => new CrovverApiClient(publicKey, tenantId, apiUrl, debug)
  );

  // Configuration
  const resolvedConfig: CrovverConfig = {
    publicKey,
    tenantId,
    apiUrl,
    portalUrl,
    onUnauthenticated,
    debug,
  };

  /**
   * Fetch subscription status from API
   */
  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.getSubscriptionStatus();

      if (response.success && response.data) {
        setSubscription(response.data);
      } else {
        const errorMessage =
          response.error?.message || "Failed to fetch subscription";
        setError(new Error(errorMessage));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  /**
   * Check if tenant has a specific feature
   */
  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (!subscription || !subscription.active || !subscription.plan) {
        return false;
      }

      return subscription.plan.features.includes(feature);
    },
    [subscription]
  );

  /**
   * Check feature access via API (more accurate than local check)
   */
  const checkFeatureAccess = useCallback(
    async (feature: string): Promise<boolean> => {
      try {
        const response = await client.checkFeatureAccess(feature);
        return response.success && response.data?.canAccess === true;
      } catch {
        return false;
      }
    },
    [client]
  );

  /**
   * Redirect user to checkout page
   * Uses public API to create checkout token directly
   */
  const redirectToCheckout = useCallback(
    async (options?: { requiredFeature?: string; requiredPlan?: string }) => {
      try {
        // Call public API to get checkout token
        const response = await fetch(
          `${apiUrl}/api/public/auth/checkout-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-public-key": publicKey,
            },
            body: JSON.stringify({
              externalTenantId: tenantId,
              externalUserId: userId,
              returnUrl: window.location.href,
              requiredFeature: options?.requiredFeature,
              requiredPlan: options?.requiredPlan,
              metadata,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create checkout token");
        }

        const data = await response.json();

        if (data.success && data.data?.token) {
          // Redirect to checkout with token
          const checkoutUrl = `${portalUrl}/pricing?token=${data.data.token}`;
          window.location.href = checkoutUrl;
        } else {
          throw new Error("Invalid token response");
        }
      } catch (err) {
        console.error("[Crovver SDK] Checkout redirect failed:", err);

        // Fallback: redirect to pricing without token
        window.location.href = `${portalUrl}/pricing`;
      }
    },
    [tenantId, portalUrl, apiUrl, publicKey, userId, metadata]
  );

  /**
   * Redirect user to self-service billing portal
   * Uses public API to create portal token directly
   */
  const redirectToPortal = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/public/auth/portal-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-public-key": publicKey,
        },
        body: JSON.stringify({
          externalTenantId: tenantId,
          returnUrl: window.location.href,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal token");
      }

      const data = await response.json();

      if (data.success && data.data?.token) {
        const portalUrlWithToken = `${portalUrl}/billing?token=${data.data.token}`;
        window.location.href = portalUrlWithToken;
      } else {
        throw new Error("Invalid token response");
      }
    } catch (err) {
      console.error("[Crovver SDK] Portal redirect failed:", err);
      window.location.href = `${portalUrl}/billing`;
    }
  }, [tenantId, portalUrl, apiUrl, publicKey]);

  /**
   * Refresh subscription data
   */
  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  // Fetch subscription on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Optional polling
  useEffect(() => {
    if (!pollInterval) return;
    const id = setInterval(fetchSubscription, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, fetchSubscription]);

  // Call onUnauthenticated callback if subscription is not active
  useEffect(() => {
    if (
      !isLoading &&
      subscription &&
      !subscription.active &&
      onUnauthenticated
    ) {
      onUnauthenticated();
    }
  }, [isLoading, subscription, onUnauthenticated]);

  // Context value
  const contextValue = {
    config: resolvedConfig,
    client,
    subscription,
    isLoading,
    error,
    isActive: subscription?.active || false,
    hasFeature,
    checkFeatureAccess,
    redirectToCheckout,
    redirectToPortal,
    refreshSubscription,
  };

  return (
    <CrovverContext.Provider value={contextValue}>
      {children}
    </CrovverContext.Provider>
  );
}
