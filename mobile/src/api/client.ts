import { useAuth } from "@clerk/expo";
import createClient, { type Client } from "openapi-fetch";
import { useCallback, useMemo } from "react";
import { config } from "../config";
import type { paths } from "./schema";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiClient = Client<paths>;

export function createApiClient(
  getToken: () => Promise<string | null>,
): ApiClient {
  const client = createClient<paths>({ baseUrl: config.apiBaseUrl });

  client.use({
    async onRequest({ request }) {
      const token = await getToken();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
    async onResponse({ response }) {
      if (!response.ok) {
        const text = await response.clone().text();
        throw new ApiError(response.status, text);
      }
    },
  });

  return client;
}

export function useApiClient(): ApiClient {
  const { getToken } = useAuth();
  const stableGetToken = useCallback(() => getToken(), [getToken]);
  return useMemo(() => createApiClient(stableGetToken), [stableGetToken]);
}
