/**
 * Type definitions for Crovver React SDK
 */

export interface CrovverConfig {
  /** Public API key (pk_live_xxx or pk_test_xxx) */
  publicKey: string;
  /** External tenant ID from your SaaS application */
  tenantId: string;
  /** Crovver API URL (optional, defaults to production) */
  apiUrl?: string;
  /** Portal URL for checkout redirects */
  portalUrl?: string;
  /** Callback when user is unauthenticated */
  onUnauthenticated?: () => void;
  /** Enable debug logging */
  debug?: boolean;
}

export interface SubscriptionStatus {
  active: boolean;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "none";
  tenant: {
    id: string;
    name: string;
    isActive: boolean;
  };
  subscription: {
    id: string;
    status: string;
    trialEndsAt?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    capacityUnits?: number;
    usedCapacity?: number;
  } | null;
  plan: {
    id: string;
    name: string;
    billingInterval: string;
    features: string[];
    isSeatBased?: boolean;
    limits: Record<string, any>;
  } | null;
}

export interface FeatureAccessResult {
  canAccess: boolean;
  featureKey: string;
  requestingEntityId: string;
}

export interface CheckoutTokenRequest {
  tenantId: string;
  returnUrl: string;
  requiredPlan?: string;
  requiredFeature?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutTokenResponse {
  token: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface PortalTokenResponse {
  token: string;
  expiresAt: string;
  portalUrl: string;
}

export interface CrovverError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: CrovverError | null;
  meta?: Record<string, any>;
}
