import { useState, useEffect } from "react";
import {
  getPermissionStatus,
  openPermissionSettings,
} from "../services/notification-service";

export function usePermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const check = async () => {
    const status = await getPermissionStatus();
    setHasPermission(status === "authorized");
  };

  useEffect(() => {
    check();
  }, []);

  return { hasPermission, request: openPermissionSettings, recheck: check };
}
