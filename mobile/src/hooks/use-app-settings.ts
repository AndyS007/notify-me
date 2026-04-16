import { useCallback, useEffect, useState } from 'react';
import {
  getAllAppSettings,
  setAppEnabled,
  type AppSettingRecord,
} from '../services/app-settings-service';
import { syncAppSettings } from '../services/app-settings-sync-service';
import { useApiClient } from '../api/client';

export function useAppSettings() {
  const [settings, setSettings] = useState<Map<string, AppSettingRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const client = useApiClient();

  const load = useCallback(async () => {
    const map = await getAllAppSettings();
    setSettings(map);
    setLoading(false);
  }, []);

  // On mount: load local first, then bidirectional sync with backend and reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      try {
        await syncAppSettings(client);
        if (!cancelled) await load();
      } catch {
        // sync failed (offline, etc.) — local data is still usable
      }
    })();
    return () => { cancelled = true; };
  }, [load, client]);

  const toggle = useCallback(
    async (packageName: string, appName: string, enabled: boolean) => {
      await setAppEnabled(packageName, appName, enabled);
      await load();
      // Fire-and-forget push to backend
      syncAppSettings(client).catch(() => {});
    },
    [load, client],
  );

  return { settings, loading, refresh: load, toggle };
}
