declare module 'expo-android-app-list' {
  export type AppEntry = {
    packageName: string;
    appName: string;
    versionName: string;
    versionCode: number;
    firstInstallTime: number;
    lastUpdateTime: number;
  };

  export function getAll(): Promise<AppEntry[]>;
  export function getPackageDetails(packageName: string): Promise<AppEntry>;
  export function getAppIcon(packageName: string, size: number): Promise<string>;
  export function getNativeLibraries(packageName: string): Promise<string[]>;
  export function getFiles(
    packageName: string,
    fileNames: string[],
  ): Promise<Array<{ content: string }>>;
  export function getPermissions(packageName: string): Promise<string[]>;
}
