# notify-me — Claude Context

## What This App Does

notify-me is an Android notification aggregator with cross-device sync. It:

1. Listens to all Android notifications in the background using `NotificationListenerService`
2. Saves each notification locally to SQLite (offline-first)
3. Syncs notifications to a Spring Boot backend (PostgreSQL)
4. The backend triggers push notifications to all other devices the user has registered

## Monorepo Layout

```
notify-me/
├── mobile/                          # Expo / React Native app
│   ├── app/                         # Expo Router screens
│   │   ├── _layout.tsx              # Root layout: ClerkProvider, DB init
│   │   ├── index.tsx                # Redirect to home
│   │   ├── (auth)/                  # Sign-in / sign-up screens
│   │   └── (home)/index.tsx         # Main notifications screen
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema (notifications table)
│   │   │   └── index.ts             # Drizzle + expo-sqlite setup
│   │   ├── services/
│   │   │   ├── notification-service.ts   # Android listener → SQLite
│   │   │   ├── headless-task.ts          # Background task handler
│   │   │   └── app-list-service.ts       # Installed app list cache
│   │   ├── hooks/
│   │   │   ├── use-notifications.ts      # Groups notifications by app
│   │   │   ├── use-app-list.ts           # Lazy app list loader
│   │   │   └── use-permission.ts         # Notification access permission
│   │   ├── components/
│   │   │   ├── AppNotificationGroup.tsx  # Expandable card per app
│   │   │   ├── NotificationItem.tsx      # Single notification row
│   │   │   ├── AppIcon.tsx               # Base64 app icon
│   │   │   ├── PermissionBanner.tsx      # Prompt to grant access
│   │   │   └── EmptyState.tsx
│   │   ├── utils/format-time.ts          # Relative time formatting
│   │   └── storage.ts                    # MMKV instance
│   ├── android/                     # Android native project
│   ├── drizzle/                     # DB migration SQL files
│   ├── app.json                     # Expo config (bundle ID: com.andys007.notifyme)
│   └── package.json
└── backend/                         # Spring Boot API
    ├── src/main/kotlin/com/andyhuang/notifyme/
    │   ├── NotifymeApplication.kt          # Entry point
    │   ├── entity/User.kt                  # JPA entity (UUID PK, Clerk user ID)
    │   ├── repository/UserRepository.kt    # JPA repo + findByClerkUserId
    │   ├── filter/ClerkAuthFilter.kt       # JWT validation, auto user creation
    │   ├── config/SecurityConfig.kt        # Spring Security config
    │   └── controller/HelloController.kt   # GET /hello (public)
    ├── src/main/resources/
    │   └── application.properties          # DB + Clerk config via env vars
    ├── Dockerfile                          # Multi-stage JDK17 → JRE17
    └── build.gradle
```

## Key Technical Decisions

- **Android only** for notification listening — `react-native-android-notification-listener` doesn't support iOS; iOS sandboxing prevents this
- **Offline-first** — notifications hit SQLite first, then sync to API; local DB is the source of truth for the UI
- **Headless task** — notification capture runs via a background headless task (`index.js` registers it) so it works when the app is backgrounded/killed
- **Clerk for auth** — handles all identity concerns (email, Google, Apple); backend validates Clerk JWTs via `ClerkAuthFilter`, auto-creating User rows on first login
- **Drizzle ORM** — chosen over direct SQLite queries for type safety and migrations
- **MMKV** — used for fast synchronous key-value storage (e.g., app list cache)

## Environment Variables

### Mobile (`mobile/.env`)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Backend (env or `.env`)
```
DB_URL=jdbc:postgresql://host:5432/notifyme
DB_USERNAME=...
DB_PASSWORD=...
CLERK_SECRET_KEY=sk_test_...
```

## Database Schema

### Mobile (SQLite via Drizzle)
**notifications** table:
- `id` — auto-increment PK
- `packageName` — app package (indexed)
- `title`, `text`, `subText` — notification content
- `timestamp` — epoch ms (indexed, descending sort)

### Backend (PostgreSQL)
**users** table:
- `id` — UUID PK
- `clerkUserId` — unique, from Clerk JWT
- `createdAt`, `updatedAt` — timestamps

## API

- Auth: all endpoints (except `/hello`, `/actuator/**`, `/swagger-ui/**`) require a Clerk Bearer token
- Backend is deployed on Render (Singapore), health check at `/actuator/health`
- Swagger UI: `/swagger-ui.html`

## Common Development Tasks

### Run mobile (dev)
```bash
cd mobile && yarn start
```

### Run mobile native build (needed for notification listener)
```bash
cd mobile && yarn android
```

### Run backend
```bash
cd backend && ./gradlew bootRun
```

### Add a DB migration (mobile)
Edit `src/db/schema.ts`, then run:
```bash
cd mobile && npx drizzle-kit generate
```

## Planned / In-Progress Features

- Push notification delivery to other registered devices when a notification is synced
- Device registration endpoint (store FCM/APNs tokens per user in backend)
- Notification filtering / mute rules
- iOS support (limited — no full notification listener possible)
