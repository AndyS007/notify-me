import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { Platform } from "react-native";
import * as schema from "./schema";

// On web SSR (static export), `openDatabaseSync` runs the wa-sqlite worker,
// which has no DOM/SharedArrayBuffer and times out with "Sync operation
// timeout". Skip initialization on the server and surface a clear error if
// any code path actually touches the db during SSR — hooks only run
// client-side, so this proxy is never hit in normal use.
const isWebSSR = Platform.OS === "web" && typeof window === "undefined";

type Db = ReturnType<typeof drizzle<typeof schema>>;

export const db: Db = isWebSSR
  ? (new Proxy({} as Db, {
      get() {
        throw new Error("db is not available during server rendering");
      },
    }) as Db)
  : drizzle(openDatabaseSync("notifications.db"), { schema });
