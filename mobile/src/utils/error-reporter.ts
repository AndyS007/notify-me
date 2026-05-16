import * as Sentry from "@sentry/react-native";

export type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

// Single entry point for reporting unexpected errors. Swap the body to
// switch providers (Bugsnag, Rollbar, …) without touching call sites.
export function reportError(error: unknown, context?: ErrorContext): void {
  Sentry.captureException(error, context);
}
