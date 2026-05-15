// Native uses the OS-native dialog via react-native's Alert, so no host is
// needed. This is a no-op so callers can mount <AlertHost /> once at the root
// without platform branching.
export function AlertHost() {
  return null;
}
