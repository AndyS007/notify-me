import { useMutation, useQuery } from '@tanstack/react-query';
import { useApiClient, type ApiClient } from './client';
import type { components } from './schema';

// ---- Types ----

export type CreateSmsRequest = components['schemas']['CreateSmsRequest'];
export type BatchCreateSmsRequest = components['schemas']['BatchCreateSmsRequest'];
export type BatchCreateSmsResponse = components['schemas']['BatchCreateSmsResponse'];
export type SmsResponse = components['schemas']['SmsResponse'];
export type SmsPageResponse = components['schemas']['SmsPageResponse'];
export type DeleteSmsResponse = components['schemas']['DeleteSmsResponse'];

// ---- API functions ----

export async function syncSmsApi(
  client: ApiClient,
  request: BatchCreateSmsRequest,
): Promise<BatchCreateSmsResponse> {
  const { data } = await client.POST('/sms/batch', { body: request });
  return data!;
}

export async function fetchSmsApi(
  client: ApiClient,
  params?: { address?: string; page?: number; size?: number },
): Promise<SmsPageResponse> {
  const { data } = await client.GET('/sms', {
    params: { query: params },
  });
  return data!;
}

export async function deleteSmsApi(
  client: ApiClient,
  id: string,
): Promise<void> {
  await client.DELETE('/sms/{id}', {
    params: { path: { id } },
  });
}

export async function deleteAllSmsApi(
  client: ApiClient,
  address?: string,
): Promise<DeleteSmsResponse> {
  const { data } = await client.DELETE('/sms', {
    params: { query: address ? { address } : {} },
  });
  return data!;
}

// ---- Hooks ----

export function useSyncSms() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (request: BatchCreateSmsRequest) => syncSmsApi(client, request),
  });
}

export function useRemoteSms(address?: string, page?: number) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['remote-sms', address, page],
    queryFn: () => fetchSmsApi(client, { address, page }),
  });
}

export function useDeleteSms() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (id: string) => deleteSmsApi(client, id),
  });
}

export function useDeleteAllSms() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (address?: string) => deleteAllSmsApi(client, address),
  });
}
