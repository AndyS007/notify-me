import { useState, useEffect } from 'react';
import { loadAppIcon } from '../services/app-list-service';

export function useAppIcon(packageName: string, size = 64) {
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAppIcon(packageName, size).then((b64) => {
      if (!cancelled) setIcon(b64);
    });
    return () => {
      cancelled = true;
    };
  }, [packageName, size]);

  return icon;
}
