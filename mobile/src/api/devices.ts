import { useMutation, useQuery } from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { useApiClient, type ApiClient } from './client';
import type { components } from './schema';
import { registerForPushTokenAsync } from '../services/push-service';

// ---- Types (generated from backend OpenAPI) ----

export type RegisterDeviceRequest = components['schemas']['RegisterDeviceRequest'];
export type RegisterDeviceResponse = components['schemas']['RegisterDeviceResponse'];
export type DeviceResponse = components['schemas']['DeviceResponse'];

// ---- API functions ----

async function collectDeviceInfo(): Promise<RegisterDeviceRequest> {
  const [deviceId, deviceName, expoPushToken] = await Promise.all([
    DeviceInfo.getUniqueId(),
    DeviceInfo.getDeviceName(),
    registerForPushTokenAsync(),
  ]);
  return {
    deviceId,
    deviceName,
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    osName: DeviceInfo.getSystemName(),
    osVersion: DeviceInfo.getSystemVersion(),
    appVersion: DeviceInfo.getVersion(),
    expoPushToken: expoPushToken ?? undefined,
    platform: Platform.OS,
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

async function fetchDevices(client: ApiClient): Promise<DeviceResponse[]> {
  const { data } = await client.GET('/devices');
  return data ?? [];
}

export function useDevices() {
  const client = useApiClient();
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => fetchDevices(client),
  });
}
