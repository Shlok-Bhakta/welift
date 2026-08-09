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

Agent skills live in `.agents/skills/demo-ios-story` and `skills/record-ios-demo`. Pull requests also get an automated iOS preview comment from `.github/workflows/ios-preview.yml`.

## Data

- Device UUID + display name on first launch
- Sessions keyed by day; fully editable
- Exercise keys: `lowercase-hyphen`
- Modes remembered per exercise (`weight` | `time`)
- Share format: `welift/v1` JSON (`.welift`)

## Releases

Run the **Unsigned builds** GitHub Action (workflow dispatch or `v*` tag).

Artifacts (attached to a GitHub Release):
- `welift-android.apk` — debug-signed release APK (sideloadable, no Play keystore)
- `welift-ios-unsigned.ipa` — unsigned device IPA (not installable on stock iOS without signing)

No Expo/`EXPO_TOKEN` required for that workflow.
