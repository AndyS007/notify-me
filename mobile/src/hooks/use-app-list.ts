import { useState, useEffect, useCallback } from 'react';
import {
  getAllApps,
  hasSyncedApps,
  syncAppsFromDevice,
  AppInfo,
} from '../services/app-list-service';

export function useAppList(includeSystem = false) {
  const [appMap, setAppMap] = useState<Map<string, AppInfo>>(new Map());
  const [ready, setReady] = useState(false);

  const readFromDb = useCallback(async () => {
    const map = await getAllApps(includeSystem);
    setAppMap(map);
    setReady(true);
  }, [includeSystem]);

  // Initial load: read from SQLite first, then sync from the device in the
  // background if the cache is empty (first launch / fresh install).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await readFromDb();
      if (cancelled) return;
      const alreadySynced = await hasSyncedApps();
      if (!alreadySynced) {
        await syncAppsFromDevice();
        if (cancelled) return;
        await readFromDb();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readFromDb]);

  const refresh = useCallback(async () => {
    setReady(false);
    await syncAppsFromDevice();
    await readFromDb();
  }, [readFromDb]);

  return { appMap, ready, refresh };
}
