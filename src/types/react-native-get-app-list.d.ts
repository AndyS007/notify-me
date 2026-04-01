declare module 'react-native-get-app-list' {
  export type AppInfo = {
    packageName: string;
    appName: string;
    icon: string;
  };

  const AppList: {
    getAppList(): Promise<AppInfo[]>;
  };

  export default AppList;
}
