import { getClerkInstance } from "@clerk/expo";
import createClient, { type Client } from "openapi-fetch";
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

const client = createClient<paths>({ baseUrl: config.apiBaseUrl });

client.use({
  async onRequest({ request }) {
    const token = await getClerkInstance().session?.getToken();
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

export { client };
