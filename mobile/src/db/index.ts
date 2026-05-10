import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { Platform } from "react-native";
import * as schema from "./schema";

// expo-sqlite's web port runs the wa-sqlite worker via SharedArrayBuffer.
// The synchronous API (which Drizzle requires) busy-loops the main thread
// waiting for the worker to signal completion; in practice this times out
// with "Sync operation timeout" both during SSR (no DOM) and in the browser
// (the maintainers acknowledge sync ops "don't work well on web" — see
// expo/expo#36392). Skip initialization on web entirely and surface a
// clear error if any code path actually touches the db. Hooks that read
// the db only run on native, so the proxy is never hit there.
type Db = ReturnType<typeof drizzle<typeof schema>>;

export const db: Db =
  Platform.OS === "web"
    ? (new Proxy({} as Db, {
        get() {
          throw new Error("Local SQLite is not supported on web yet");
        },
      }) as Db)
    : drizzle(openDatabaseSync("notifications.db"), { schema });
