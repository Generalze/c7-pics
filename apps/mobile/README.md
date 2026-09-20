# PICS Agent (mobile)

The field app for polling unit agents. Android first; built with Expo and
EAS. It talks only to the C7-PICS API at `EXPO_PUBLIC_API_BASE_URL`
(production: `https://pics.consummate7.com/api`).

## What it does (version 0.1)

- Sign in with GPS consent (the API refuses agent sign-in without it). Only
  accounts with a polling-unit field profile are admitted.
- Status: today's picture for the agent's polling unit and recent activity.
- Duty: check in and out with a GPS fix; location pings every 5 minutes while
  on duty and the app is in the foreground.
- Incident report with type, severity, title, description and location.
- Election-day report: opening status, arrival photo, observations, five party
  vote entries, post-counting photo. One report per polling unit per day.
- Tasks assigned by coordinators, with status updates.
- Notifications and sign-out.

Not in this release: messaging, calls, background location, push notifications.

## Run locally

```bash
cd apps/mobile
npm run lint          # tsc --noEmit
npx expo start        # then open in a development build or Expo Go
```

Point a local session at another API with `EXPO_PUBLIC_API_BASE_URL=... npx expo start`.

## Build an APK

The EAS project lives under the `consummate7` Expo account (see `owner` in
`app.json`). Builds are a scarce monthly allowance: batch changes, type-check,
and build once.

```bash
cd apps/mobile
npx eas-cli build --platform android --profile production-apk
```

`eas.json` sets the production API URL for every profile. The Android package
is `ng.pics.agent`.
