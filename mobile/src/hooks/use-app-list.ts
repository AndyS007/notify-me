import { useState, useEffect, useCallback } from 'react';
import { loadAppList, clearAppListCache, AppInfo } from '../services/app-list-service';

export function useAppList() {
  const [appMap, setAppMap] = useState<Map<string, AppInfo>>(new Map());
  const [ready, setReady] = useState(false);

  const load = useCallback(() => {
    loadAppList().then((map) => {
      setAppMap(map);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    clearAppListCache();
    setReady(false);
    load();
  }, [load]);

  return { appMap, ready, refresh };
}
