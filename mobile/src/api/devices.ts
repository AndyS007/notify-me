import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeviceInfo from "react-native-device-info";
import { Platform } from "react-native";
import {
  api,
  type DeviceResponse,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
  type UpdateDeviceRequest,
} from "./backend";
import { registerForPushTokenAsync } from "../services/push-service";

export type {
  RegisterDeviceRequest,
  RegisterDeviceResponse,
  DeviceResponse,
  UpdateDeviceRequest,
};

const DEVICES_QUERY_KEY = ["devices"] as const;

// ---- API helpers ----

let cachedDeviceId: string | null = null;

export async function getLocalDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  cachedDeviceId = await DeviceInfo.getUniqueId();
  return cachedDeviceId;
}

let registrationPromise: Promise<RegisterDeviceResponse> | null = null;
let deviceRegistered = false;

export function isDeviceRegistered(): boolean {
  return deviceRegistered;
}

export function waitForDeviceRegistration(): Promise<RegisterDeviceResponse> | null {
  return registrationPromise;
}

async function collectDeviceInfo(): Promise<RegisterDeviceRequest> {
  const [deviceId, deviceName] = await Promise.all([
    getLocalDeviceId(),
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
    platform: Platform.OS,
  };
}

export async function registerDeviceApi(): Promise<RegisterDeviceResponse> {
  if (registrationPromise) return registrationPromise;
  registrationPromise = (async () => {
    try {
      const body = await collectDeviceInfo();
      const result = await api.registerDevice(body);
      deviceRegistered = true;
      return result;
    } catch (err) {
      registrationPromise = null;
      throw err;
    }
  })();
  return registrationPromise;
}

export async function syncPushTokenAsync(): Promise<void> {
  if (registrationPromise) {
    try {
      await registrationPromise;
    } catch {
      return;
    }
  } else if (!deviceRegistered) {
    return;
  }

  const expoPushToken = await registerForPushTokenAsync();
  if (!expoPushToken) return;

  const deviceId = await getLocalDeviceId();
  await api.registerDevice({
    deviceId,
    platform: Platform.OS,
    expoPushToken,
  });
}

async function fetchDevices(): Promise<DeviceResponse[]> {
  return api.fetchDevices();
}

async function updateDeviceApi(
  id: string,
  body: UpdateDeviceRequest,
): Promise<DeviceResponse> {
  return api.updateDevice(id, body);
}

// ---- Hooks ----

export function useRegisterDevice() {
  return useMutation({
    mutationFn: () => registerDeviceApi(),
  });
}

export function useDevices() {
  return useQuery({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: () => fetchDevices(),
  });
}

export function useUpdateDevicePushEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pushEnabled }: { id: string; pushEnabled: boolean }) =>
      updateDeviceApi(id, { pushEnabled }),
    onMutate: async ({ id, pushEnabled }) => {
      await queryClient.cancelQueries({ queryKey: DEVICES_QUERY_KEY });
      const previous =
        queryClient.getQueryData<DeviceResponse[]>(DEVICES_QUERY_KEY);
      queryClient.setQueryData<DeviceResponse[]>(DEVICES_QUERY_KEY, (old) =>
        old?.map((d) => (d.id === id ? { ...d, pushEnabled } : d)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DEVICES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}
