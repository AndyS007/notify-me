import "./src/theme/unistyles";
import { AppRegistry, Platform } from "react-native";
import "expo-router/entry";

if (Platform.OS === "android") {
  const {
    RNAndroidNotificationListenerHeadlessJsName,
  } = require("react-native-android-notification-listener");
  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () => require("./src/services/headless-task").default,
  );
}
