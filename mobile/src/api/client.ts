import { useAuth } from '@clerk/expo';
import { useCallback } from 'react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8080';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private getToken: () => Promise<string | null>) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(response.status, text);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export function useApiClient(): ApiClient {
  const { getToken } = useAuth();
  const stableGetToken = useCallback(() => getToken(), [getToken]);
  return new ApiClient(stableGetToken);
}
