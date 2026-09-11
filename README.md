# WeLift

Private lift logging for you and your circle. No server — export a `.welift` file, import on another phone, done.

Matches the **Week Ultimate** mockup: rolling 7-day rail, editable sessions, weight × reps or time-based lifts, chalk palette locked.

## Platforms

- **iOS** — Liquid Glass surfaces via `expo-glass-effect` (iOS 26+; falls back cleanly otherwise)
- **Android** — same screens with Material-ish system chrome / solid chalk surfaces (not tested in this pass)

Color scheme is **fixed dark chalk**. No in-app theme toggle.

## Develop (iOS)

```bash
npm install --legacy-peer-deps
npm run ios
```

## Story acceptance

Feature work follows the Music Tools issue-to-PR loop: implement with tests, prove the visible path with Maestro, record a short simulator demo, upload it to Planista, and attach the permalink on the PR.

```bash
npm run validate
npm run ios:e2e          # writes artifacts/e2e-demo.mp4
scripts/upload-demo.sh artifacts/e2e-demo.mp4
```

Agent skills live in `.agents/skills/demo-ios-story` and `skills/record-ios-demo`. Every PR also gets installable builds from `.github/workflows/pr-preview.yml`: an ephemeral `pr-<n>` prerelease (APK + unsigned IPA) with an Autoloader install bot comment.

## Data

- Device UUID + display name on first launch
- Sessions keyed by day; fully editable
- Exercise keys: `lowercase-hyphen`
- Modes remembered per exercise (`weight` | `time`)
- Share format: `welift/v1` JSON (`.welift`)

## Releases

Tagless semantic releases off `main` (`.github/workflows/release.yml`):

- Title your PR `fix: ...` (patch), `feat: ...` (minor), or `feat!: ...` (major) and squash-merge. Any other title builds nothing.
- Each release title publishes a moving `main-latest` prerelease with stable URLs:
  - `.../releases/download/main-latest/welift-android.apk` — debug-signed release APK (sideloadable, no Play keystore)
  - `.../releases/download/main-latest/welift-ios-unsigned.ipa` — unsigned device IPA (Autoloader signs it on-device)
- iPhone install: open the Autoloader shim link from the release notes in Safari.
- Manual fallback: run the **Tagless release** GitHub Action (workflow dispatch) to rebuild `main-latest` on demand.

No Expo/`EXPO_TOKEN` required for any of this.
