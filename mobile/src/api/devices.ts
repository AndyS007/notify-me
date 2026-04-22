import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import DeviceInfo from "react-native-device-info";
import { Platform } from "react-native";
import { client } from "./client";
import type { components } from "./schema";
import { registerForPushTokenAsync } from "../services/push-service";

// ---- Types (generated from backend OpenAPI) ----

export type RegisterDeviceRequest =
  components["schemas"]["RegisterDeviceRequest"];
export type RegisterDeviceResponse =
  components["schemas"]["RegisterDeviceResponse"];
export type DeviceResponse = components["schemas"]["DeviceResponse"];
export type UpdateDeviceRequest = components["schemas"]["UpdateDeviceRequest"];

const DEVICES_QUERY_KEY = ["devices"] as const;

// ---- API functions ----

// Cache the local deviceId. getUniqueId() is stable for the lifetime of the
// install, so we read it once.
let cachedDeviceId: string | null = null;

export async function getLocalDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  cachedDeviceId = await DeviceInfo.getUniqueId();
  return cachedDeviceId;
}

// Tracks whether the current install has completed a successful
// /devices/register call. The backend rejects notification syncs from
// unregistered devices, so the sync pipeline gates on this.
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
      const { data } = await client.POST("/devices/register", { body });
      deviceRegistered = true;
      return data!;
    } catch (err) {
      registrationPromise = null;
      throw err;
    }
  })();
  return registrationPromise;
}

// Asks the OS for notification permission and, if granted, PATCHes the new
// Expo push token onto the already-registered device. Safe to call multiple
// times — the token won't change for the lifetime of the install. Sequenced
// after registerDeviceApi so the device row exists before we try to update
// it.
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
  await client.POST("/devices/register", {
    body: {
      deviceId,
      platform: Platform.OS,
      expoPushToken,
    },
  });
}

async function fetchDevices(): Promise<DeviceResponse[]> {
  const { data } = await client.GET("/devices");
  return data ?? [];
}

async function updateDeviceApi(
  id: string,
  body: UpdateDeviceRequest,
): Promise<DeviceResponse> {
  const { data } = await client.PATCH("/devices/{id}", {
    params: { path: { id } },
    body,
  });
  return data!;
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
