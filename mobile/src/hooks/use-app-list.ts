import { useState, useEffect } from 'react';
import { loadAppList, AppInfo } from '../services/app-list-service';

export function useAppList() {
  const [appMap, setAppMap] = useState<Map<string, AppInfo>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAppList().then((map) => {
      setAppMap(map);
      setReady(true);
    });
  }, []);

  return { appMap, ready };
}
