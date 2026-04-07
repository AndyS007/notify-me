# notify-me

A mobile app that listens to Android notifications, saves them to a local database, syncs them to a backend API, and triggers push notifications to all other devices the user has registered.

## Features

- **Notification Recording** — Uses Android's Notification Listener Service to capture notifications from all installed apps in the background
- **Local Storage** — Persists notifications in a local SQLite database (via Drizzle ORM) so they're available offline
- **Backend Sync** — Sends captured notifications to a REST API which stores them in PostgreSQL
- **Cross-device Push** — The backend triggers push notifications to all other devices the user is logged in on
- **Grouped View** — Notifications are grouped by app with expandable cards showing history
- **Authentication** — Email/password, Google, and Apple Sign-In via Clerk

## Monorepo Structure

```
notify-me/
├── mobile/          # React Native (Expo) app
└── backend/         # Spring Boot (Kotlin) API
```

## Tech Stack

### Mobile
| Layer | Technology |
|---|---|
| Framework | Expo 55 / React Native 0.83 |
| Language | TypeScript |
| Routing | Expo Router (file-based) |
| Auth | Clerk (`@clerk/expo`) |
| Local DB | SQLite + Drizzle ORM |
| Notification listener | `react-native-android-notification-listener` |
| Storage | MMKV |
| Animations | React Native Reanimated |

### Backend
| Layer | Technology |
|---|---|
| Framework | Spring Boot 4.0.5 |
| Language | Kotlin |
| ORM | Spring Data JPA / Hibernate |
| Database | PostgreSQL |
| Auth | Spring Security + Clerk JWT validation |
| API Docs | Springdoc OpenAPI (Swagger UI) |
| Deployment | Render (Docker) |

## Getting Started

### Prerequisites
- Node.js + Yarn
- Expo CLI (`npm install -g expo-cli`)
- Android device or emulator (notification listener requires Android)
- JDK 17 (for backend)
- PostgreSQL database

### Mobile Setup

```bash
cd mobile
yarn install
```

Copy the environment file and add your Clerk publishable key:

```bash
cp ../.env.example .env
# Edit .env and set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
```

Start the dev server:

```bash
yarn start
```

For a native build (required for notification listener access):

```bash
yarn android
```

> **Note:** The notification listener service does not work in Expo Go — a native build is required.

### Backend Setup

```bash
cd backend
```

Set environment variables:

```
DB_URL=jdbc:postgresql://localhost:5432/notifyme
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
CLERK_SECRET_KEY=sk_test_...
```

Run with Gradle:

```bash
./gradlew bootRun
```

Or build and run with Docker:

```bash
docker build -t notifyme-backend .
docker run -p 8080:8080 --env-file .env notifyme-backend
```

Swagger UI is available at `http://localhost:8080/swagger-ui.html`.

## How It Works

1. The user grants **Notification Access** permission on Android
2. `NotificationListenerService` (running as a headless background task) captures incoming notifications
3. Each notification is saved locally to SQLite via Drizzle ORM
4. The notification is POSTed to the backend API (authenticated with a Clerk JWT)
5. The backend persists it in PostgreSQL and sends a push notification to all other registered devices for that user

## Authentication Flow

- Clerk handles all auth on the mobile side (email/password, Google, Apple)
- The mobile app attaches the Clerk session token to API requests
- The backend's `ClerkAuthFilter` validates the JWT, looks up or auto-creates the user in the database, and injects the user into the security context

## Deployment

Backend is configured for [Render](https://render.com) via `render.yaml` (Singapore region, free tier, health check at `/actuator/health`).

Mobile builds are managed via Expo EAS (`mobile/eas.json`).
