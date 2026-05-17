import { eq } from "drizzle-orm";
import { db } from "@db";
import { appSettings } from "@db/schema";
import { reportError } from "@utils/error-reporter";
import { loadAppIcon } from "@services/app-list-service";
import { uploadAppIconApi, pushAppSettingsApi } from "@api/app-settings";

export type AppSettingRecord = typeof appSettings.$inferSelect;

export async function getAllAppSettings(): Promise<
  Map<string, AppSettingRecord>
> {
  const rows = await db.select().from(appSettings);
  return new Map(rows.map((r) => [r.packageName, r]));
}

/**
 * Whether notifications from a package should be captured. Tracking is
 * strictly opt-in: if there's no row yet, or the row exists but the user
 * hasn't enabled it, we return false so we never persist or sync a
 * notification the user didn't ask for.
 */
export async function isAppEnabled(packageName: string): Promise<boolean> {
  if (packageName === "com.andys007.notifyme") return false;
  const rows = await db
    .select({ enabled: appSettings.enabled })
    .from(appSettings)
    .where(eq(appSettings.packageName, packageName))
    .limit(1);
  if (rows.length === 0) return false;
  return rows[0].enabled === 1;
}

/**
 * Toggle whether we capture notifications for `packageName`. When the user
 * is turning it ON, we also upload the app's icon to the backend (which
 * stores it in S3) so other devices and the web client can render it,
 * then push the setting to the backend so the choice is shared across
 * the user's devices.
 */
export async function setAppEnabled(
  packageName: string,
  appName: string,
  enabled: boolean,
): Promise<void> {
  const value = enabled ? 1 : 0;
  const now = Date.now();

  let appIconUrl: string | null | undefined;
  if (enabled) {
    appIconUrl = await uploadIconForPackage(packageName, appName);
  }

  await db
    .insert(appSettings)
    .values({
      packageName,
      appName,
      enabled: value,
      updatedAt: now,
      ...(appIconUrl !== undefined ? { appIconUrl } : {}),
    })
    .onConflictDoUpdate({
      target: appSettings.packageName,
      set: {
        enabled: value,
        appName,
        updatedAt: now,
        ...(appIconUrl !== undefined ? { appIconUrl } : {}),
      },
    });

  // Push this single setting to the backend so other devices see the change
  // without waiting for the next batch sync. Failures are logged but don't
  // block the local toggle — the regular sync job will pick it up.
  try {
    const row = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.packageName, packageName))
      .limit(1);
    if (row.length > 0) {
      const r = row[0];
      await pushAppSettingsApi([
        {
          packageName: r.packageName,
          appName: r.appName,
          enabled: r.enabled === 1,
          isSystemApp: r.isSystemApp === 1,
          appIconUrl: r.appIconUrl ?? null,
          updatedAt: r.updatedAt,
        },
      ]);
    }
  } catch (err) {
    reportError(err);
  }
}

async function uploadIconForPackage(
  packageName: string,
  appName: string,
): Promise<string | null | undefined> {
  try {
    const base64 = await loadAppIcon(packageName);
    if (!base64) return undefined;
    const res = await uploadAppIconApi({
      packageName,
      appName,
      iconBase64: base64,
    });
    return res.appIconUrl ?? null;
  } catch (err) {
    reportError(err);
    return undefined;
  }
}
