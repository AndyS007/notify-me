export const config = {
  publishableKey:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_your_publishable_key_here",
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://notify-me-backend-p7ft.onrender.com",
};
