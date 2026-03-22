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
      const headers: HeadersInit = {
        ...options?.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
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
   * Get subscription status for tenant
   */
  async getSubscriptionStatus(): Promise<ApiResponse<SubscriptionStatus>> {
    const params = new URLSearchParams({
      publicKey: this.publicKey,
      tenantId: this.tenantId,
    });

    return this.request<SubscriptionStatus>(
      `/api/public/subscriptions/status?${params}`
    );
  }

  /**
   * Check if tenant has access to a specific feature
   */
  async checkFeatureAccess(
    feature: string
  ): Promise<ApiResponse<FeatureAccessResult>> {
    const params = new URLSearchParams({
      publicKey: this.publicKey,
      featureKey: feature,
      requestingEntityId: this.tenantId,
    });

    return this.request<FeatureAccessResult>(`/api/public/can-access?${params}`);
  }
}
