import { useCallback, useEffect, useState } from 'react';
import {
  getSmsPermissionStatus,
  requestSmsPermission,
} from '../services/sms-listener';

export function useSmsPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    const status = await getSmsPermissionStatus();
    setHasPermission(
      status.hasReadSmsPermission && status.hasReceiveSmsPermission,
    );
  }, []);

  const request = useCallback(async () => {
    const granted = await requestSmsPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { hasPermission, request, recheck: check };
}
