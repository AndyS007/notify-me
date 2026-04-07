import { useMutation } from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';
import { useApiClient, type ApiClient } from './client';
import type { components } from './schema';

// ---- Types (generated from backend OpenAPI) ----

export type RegisterDeviceRequest = components['schemas']['RegisterDeviceRequest'];
export type RegisterDeviceResponse = components['schemas']['RegisterDeviceResponse'];

// ---- API functions ----

async function collectDeviceInfo(): Promise<RegisterDeviceRequest> {
  const [deviceId, deviceName] = await Promise.all([
    DeviceInfo.getUniqueId(),
    DeviceInfo.getDeviceName(),
  ]);
  return {
    deviceId,
    deviceName,
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    osName: DeviceInfo.getSystemName(),
    osVersion: DeviceInfo.getSystemVersion(),
    appVersion: DeviceInfo.getVersion(),
  };
}

export async function registerDeviceApi(client: ApiClient): Promise<RegisterDeviceResponse> {
  const body = await collectDeviceInfo();
  const { data } = await client.POST('/devices/register', { body });
  return data!;
}

// ---- Hooks ----

export function useRegisterDevice() {
  const client = useApiClient();
  return useMutation({
    mutationFn: () => registerDeviceApi(client),
  });
}
