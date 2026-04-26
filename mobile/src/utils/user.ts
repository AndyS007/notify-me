import { useUser } from "@clerk/expo";

type ClerkUser = ReturnType<typeof useUser>["user"];

export function getInitials(
  name: string | null | undefined,
  email: string,
): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

export function getDisplayName(user: ClerkUser): string {
  if (!user) return "";
  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.primaryEmailAddress?.emailAddress ||
    ""
  );
}
