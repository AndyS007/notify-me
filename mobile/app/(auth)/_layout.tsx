import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  // <ClerkLoaded> in the root gates rendering until isLoaded is true.
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(home)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
