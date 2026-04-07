import { useMutation } from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';
import { ApiClient, useApiClient } from './client';

// ---- Types ----

export type RegisterDeviceRequest = {
  deviceId: string;
  deviceName: string | null;
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  appVersion: string;
};

export type RegisterDeviceResponse = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  brand: string | null;
  model: string | null;
  osName: string | null;
  osVersion: string | null;
  appVersion: string | null;
};

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
  const info = await collectDeviceInfo();
  return client.post<RegisterDeviceResponse>('/devices/register', info);
}

// ---- Hooks ----

export function useRegisterDevice() {
  const client = useApiClient();
  return useMutation({
    mutationFn: () => registerDeviceApi(client),
  });
}
