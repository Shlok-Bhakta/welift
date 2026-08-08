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

Tag a version (`v1.0.0`) or run the **Release builds** GitHub Action.

Requires repo secret `EXPO_TOKEN` and a real EAS project id in `app.json` → `extra.eas.projectId` (replace the placeholder after `eas init`).

Builds iOS + Android with EAS and attaches artifacts to the GitHub Release.
