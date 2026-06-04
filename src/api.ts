/**
 * API Client for Crovver React SDK
 * Handles communication with Crovver public API
 */

import type {
  ApiResponse,
  SubscriptionStatus,
  FeatureAccessResult,
} from "./types";
import { CROVVER_URL } from "./config";

export class CrovverApiClient {
  private publicKey: string;
  private tenantId: string;
  private apiUrl: string;
  private debug: boolean;

  constructor(
    publicKey: string,
    tenantId: string,
    apiUrl?: string,
    debug?: boolean
  ) {
    this.publicKey = publicKey;
    this.tenantId = tenantId;
    this.apiUrl = apiUrl || CROVVER_URL.API;
    this.debug = debug || false;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[Crovver SDK]", ...args);
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.apiUrl}${endpoint}`;

    this.log("Request:", url, options);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
        },
      });

      const data: ApiResponse<T> = await response.json();

      this.log("Response:", data);

      return data;
    } catch (error) {
      this.log("Error:", error);

      return {
        success: false,
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Network request failed",
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  /**
   * Get subscription status for tenant.
   * Pass productSlug to scope the result to a specific product — required when
   * a tenant holds subscriptions to multiple products simultaneously.
   */
  async getSubscriptionStatus(
    productSlug?: string
  ): Promise<ApiResponse<SubscriptionStatus>> {
    const params = new URLSearchParams({
      publicKey: this.publicKey,
      tenantId: this.tenantId,
    });

    if (productSlug) params.set("productSlug", productSlug);

    return this.request<SubscriptionStatus>(
      `/api/public/subscriptions/status?${params}`
    );
  }

  /**
   * Check if tenant has access to a feature or product.
   *
   * Modes:
   * - featureKey only   → feature flag + credit check on most recent active sub
   * - featureKey + productSlug → feature flag check scoped to that product
   * - productSlug only  → subscription-existence check (is tenant subscribed to this product?)
   *
   * At least one of featureKey or productSlug must be provided.
   */
  async checkFeatureAccess(
    featureKey?: string,
    productSlug?: string
  ): Promise<ApiResponse<FeatureAccessResult>> {
    // publicKey must be a query param — authenticateRequest reads from searchParams, not body
    const params = new URLSearchParams({ publicKey: this.publicKey });

    return this.request<FeatureAccessResult>(
      `/api/public/can-access?${params}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingEntityId: this.tenantId,
          ...(featureKey && { featureKey }),
          ...(productSlug && { productSlug }),
        }),
      }
    );
  }
}
