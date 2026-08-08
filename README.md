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
