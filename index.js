import { AppRegistry } from 'react-native';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';
import 'expo-router/entry';

AppRegistry.registerHeadlessTask(
  RNAndroidNotificationListenerHeadlessJsName,
  () => require('./src/services/headless-task').default,
);
