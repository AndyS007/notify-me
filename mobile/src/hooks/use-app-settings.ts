import { useCallback, useEffect, useState } from "react";
import {
  getAllAppSettings,
  setAppEnabled,
  type AppSettingRecord,
} from "../services/app-settings-service";

export function useAppSettings() {
  const [settings, setSettings] = useState<Map<string, AppSettingRecord>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const map = await getAllAppSettings();
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (packageName: string, appName: string, enabled: boolean) => {
      await setAppEnabled(packageName, appName, enabled);
      await load();
    },
    [load],
  );

  return { settings, loading, refresh: load, toggle };
}
