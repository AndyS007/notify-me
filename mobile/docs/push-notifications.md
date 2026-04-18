# Push Notifications

End-to-end flow:

1. Device A captures an Android system notification via the notification
   listener service.
2. `syncUnsynced` in `src/services/sync-service.ts` POSTs it to
   `/notifications/batch` on the backend.
3. Backend persists the notification, then fans it out via the Expo Push API
   (`https://exp.host/--/api/v2/push/send`) to every _other_ device of the
   same user that has a registered `expoPushToken`.
4. Device B receives the push. `initPushNotifications()` in
   `src/services/push-service.ts` shows it as a system notification. The
   listener in `app/(home)/_layout.tsx` also triggers `pullRemoteNotifications`
   so the list reflects the new item when the user opens the app.

## Android setup (required)

The Android build ships Expo's Firebase server key automatically when the app
is built through EAS with `eas build`. For a _local_ dev client build to
deliver pushes you must either:

- Run `eas build --profile development --platform android` so EAS injects the
  `google-services.json` it manages, **or**
- Add your own Firebase project and drop `google-services.json` into
  `android/app/` before running `expo run:android`.

Without Firebase credentials, `getExpoPushTokenAsync` still returns a token
but pushes will not be delivered to the device.

## iOS setup (TODO — skipped until Apple Developer account is available)

The codebase is prepared — only credentials and a build are missing.

Checklist:

- [ ] Enroll in the Apple Developer Program.
- [ ] In the Apple developer console, create an APNs Auth Key (.p8) with the
      "Apple Push Notifications service" capability.
- [ ] Upload the key to EAS:
      `eas credentials` → iOS → Push Notifications → Add a new key.
- [ ] Run `eas build --profile production --platform ios`. The
      `expo-notifications` config plugin already adds the push entitlement.
- [ ] If silent / background pulls are desired, add
      `"UIBackgroundModes": ["remote-notification"]` under `ios.infoPlist`
      in `app.json` and set `_contentAvailable: true` on outbound Expo
      messages from the backend.
- [ ] Request notification permissions on first launch — already handled by
      `registerForPushTokenAsync()`.

No source changes should be needed beyond the entitlement/credential work.
