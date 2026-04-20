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

export async function registerDeviceApi(): Promise<RegisterDeviceResponse> {
  const body = await collectDeviceInfo();
  const { data } = await client.POST("/devices/register", { body });
  return data!;
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
