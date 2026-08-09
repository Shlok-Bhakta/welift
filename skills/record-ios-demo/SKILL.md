---
name: record-ios-demo
description: Record concise iOS Simulator acceptance demos whose video begins immediately before the meaningful interaction and ends immediately after the final visible result. Use when writing Maestro flows, fixing padded or stale iOS recordings, creating PR demo videos, or validating and preparing a simulator MP4 for upload.
---

# Record an iOS Demo

Capture the exact acceptance journey, without simulator setup, app installation, test-driver startup, teardown, or idle padding.

## Build the flow

1. Express observable acceptance criteria with stable text or accessibility IDs. Avoid coordinates.
2. Launch or clear the app before recording.
3. Wait for the known initial screen before recording.
4. Put Maestro's `startRecording` immediately before the first meaningful action.
5. Perform focused interactions and assert each visible outcome.
6. Put `stopRecording` immediately after the final visible assertion. Do not record navigation used only to reset state.

```yaml
appId: com.example.app
---
- launchApp:
    clearState: true
- extendedWaitUntil:
    visible: "Ready"
    timeout: 15000
- startRecording: acceptance-demo
- tapOn: "Explore"
- tapOn: "Details"
- assertVisible: "Expected result"
- stopRecording
```

## Run reliably

1. Build, boot, and install the intended app before invoking Maestro. Never accept whatever build happens to be installed.
2. Delete only the known generated output path before the run so a failure cannot publish a stale video.
3. Pass `--test-output-dir` to keep `startRecording` output in a fresh, run-specific temporary directory.
4. Let Maestro own recording boundaries. Do not wrap `maestro test` with `simctl recordVideo`; the CLI process includes driver startup and teardown.
5. Retry only recognized transient driver-startup failures. Use a fresh output directory for every retry.
6. Locate the named non-empty MP4 from the current output directory. Maestro's encoder may leave a static ready screen at the front, so use FFmpeg `freezedetect` to find an initial freeze that begins at zero and lasts at least two seconds. Trim to roughly half a second before its end. Never remove a hard-coded number of seconds.
7. Normalize the trimmed video with FFmpeg, then remove the run-specific temporary directory.

## Validate before upload

1. Use `ffprobe` to confirm the file is readable, non-empty, and plausibly short. Treat duration limits as guardrails, not proof of good boundaries.
2. Extract or inspect frames near the beginning, middle, and end. The first frame must show the ready app, and the last must show the final asserted state. Reject launch screens, unrelated builds, home-screen flashes, secrets, private data, and idle tails.
3. Watch the full video once. Confirm every requested interaction is visible and understandable without narration.
4. Upload only after inspection. Treat the returned link as public; open it to verify playback.
5. Delete only temporary files created by the run after successful upload and link verification. Preserve the reviewed artifact when the repository or CI expects it, and never delete unrelated user material.

## Report

Report the flow covered, recording duration and size, inspection points, upload permalink if authorized, and cleanup performed. Never claim a demo is useful based only on a successful test command.
