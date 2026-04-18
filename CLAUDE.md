# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**notify-me** is a cross-device Android notification aggregator. The Android app listens for system notifications, persists them locally in SQLite, syncs them to a Spring Boot backend (PostgreSQL), and pulls them back down to all registered devices.

## Repository Layout

Monorepo with two independently buildable sub-projects:

- `mobile/` — Expo 55 / React Native app (TypeScript)
- `backend/` — Spring Boot 4 / Kotlin REST API

## Commands

### Mobile (`cd mobile`)

```bash
yarn install          # Install dependencies
yarn start            # Start Expo dev server
yarn android          # Build & run on Android
yarn ios              # Build & run on iOS
yarn lint             # Run ESLint
yarn db:generate      # Regenerate Drizzle SQLite migrations after schema changes
yarn api:types        # Regenerate TypeScript types from backend OpenAPI spec
```

> Note: The notification listener (`react-native-android-notification-listener`) requires a native build — it does not work in Expo Go.

### Backend (`cd backend`)

```bash
./gradlew bootRun       # Start dev server
./gradlew build -x test # Build JAR (skip tests)
./gradlew test          # Run tests
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

## Environment Variables

**Mobile** (`.env` in `mobile/`):

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_BASE_URL=https://...
```

**Backend** (env vars or `application-local.properties`):

```
DB_URL=jdbc:postgresql://...
DB_USERNAME=...
DB_PASSWORD=...
CLERK_SECRET_KEY=sk_test_...
```

## Architecture

### Notification Lifecycle

1. **Capture**: Android's `NotificationListenerService` fires a headless JS task on each notification.
2. **Local persist**: `src/services/notification-service.ts` filters by per-app toggle (SQLite `appSettings` table) and writes to the `notifications` table via Drizzle ORM.
3. **Push sync** (`src/services/sync-service.ts`): Batches rows where `synced=0`, POSTs to `POST /notifications/batch`, marks them `synced=1`.
4. **Pull sync**: Fetches paginated notifications from the backend and inserts any missing ones (deduplication by `packageName + timestamp`).

### Authentication

Clerk handles identity throughout:

- Mobile: `@clerk/expo` provides the session JWT; the API client attaches it as a Bearer token.
- Backend: `ClerkAuthFilter` validates the JWT against `CLERK_SECRET_KEY`, then auto-creates or looks up the `User` row and injects it into the Spring Security context.

### API Client (Mobile)

Types are generated from the backend's OpenAPI spec via `yarn api:types` → `src/api/api-types.ts`. The client in `src/api/api-client.ts` uses `openapi-fetch`. After changing backend controllers, re-run the type generation script.

### Database (Mobile)

SQLite via Drizzle ORM. Schema lives in `src/db/schema.ts`. After editing the schema, run `yarn db:generate` to produce a new migration in `drizzle/`.

### Backend Entities

Three JPA entities: `User`, `Device`, `Notification`. The unique constraint on `(user_id, device_id, package_name, timestamp)` prevents duplicate notifications. Schema is managed by `spring.jpa.hibernate.ddl-auto=update` — no migrations tool.

## Deployment

- **Backend**: Docker → Render (`render.yaml`, Singapore region). Build with `docker build -t notifyme-backend ./backend`.
- **Mobile**: EAS continuous deploy — pushing to `main` triggers the `.github/workflows/mobile-ci.yml` workflow, which runs `eas update --channel production`.

## Rule of thumb

- when using third-party library, don't
  shing to `main` triggers the `.github/workflows/mobile-ci.yml` workflow, which runs `eas update --channel production`.
- when using thrird-party library, don't create a type file if it already has been typed, should always
  refernece the type from the library itself, don't take a guess, but do create one if it's js library
