import Constants from "expo-constants";

export const APP_PACKAGE_NAME =
  Constants.expoConfig?.android?.package ?? "com.andys007.notifyme";

export const config = {
  publishableKey:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_Y3VycmVudC1tb2xlLTg2LmNsZXJrLmFjY291bnRzLmRldiQ",
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://notify-me-backend-p7ft.onrender.com",
};
