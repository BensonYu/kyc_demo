# KYC Demo Technical Design

## 1. Architecture Summary

The app is a React + Expo mobile application with no backend. It runs the full demo KYC flow locally on the device.

Core modules:

- App shell and navigation.
- Permission manager.
- Camera capture module.
- Biometric authentication module.
- Liveness challenge module.
- Local quality check module.
- Mock scoring engine.
- Result presentation.

Recommended libraries:

- React Native through Expo.
- `expo-camera` for camera preview, still photo capture, and 5-second video recording.
- `expo-local-authentication` for optional Face ID, Touch ID, or Android biometric authentication.
- `expo-file-system` for local session artifact handling.
- Expo development build for native modules and biometric testing beyond Expo Go.

## 2. Runtime Boundaries

MVP runs entirely on-device:

- No remote upload.
- No API calls.
- No backend persistence.
- No production identity verification.

Captured artifacts should be stored in app-controlled temporary or document storage only long enough to complete the demo session.

## 3. Flow State Model

Use a typed state machine or reducer instead of implicit screen flags.

Recommended states:

| State | Meaning |
| --- | --- |
| `idle` | User is on the home screen. |
| `consent` | User is reviewing privacy and consent copy. |
| `requestingPermissions` | App is requesting camera/microphone permissions. |
| `cameraReady` | Camera preview is visible and ready. |
| `capturingPhoto` | App is taking the face photo. |
| `recordingVideo` | App is recording the 5-second selfie video. |
| `biometricCheck` | App is attempting optional system biometric authentication. |
| `livenessChallenge` | User is completing action challenge fallback/core liveness. |
| `processing` | App runs quality checks and mock scoring. |
| `resultPass` | Demo verification passed. |
| `resultRetry` | User should retry capture or challenge. |
| `resultReview` | Signals indicate manual review. |
| `error` | Recoverable error state. |

Session data should include:

- Session ID.
- Created timestamp.
- Photo URI.
- Video URI.
- Video duration.
- Permission statuses.
- Biometric availability and result.
- Liveness challenge type and result.
- Quality check signals.
- Mock risk score.
- Final decision.

## 4. Camera Capture

### Photo

- Use the front camera.
- Show face alignment guidance.
- Capture one still image before or after video recording.
- Store the photo URI in the session object.

### 5-Second Video

- Use front camera recording.
- Record exactly one 5-second selfie clip where possible.
- Show recording progress.
- Stop automatically when the timer reaches 5 seconds.
- Store the video URI and measured duration in the session object.
- If the user cancels before 5 seconds, mark the session as retry.

### Capture Quality Inputs

The MVP can start with heuristic or mocked signals if frame-level analysis is not yet implemented:

- Face present.
- Single face.
- Brightness acceptable.
- Blur acceptable.
- Face centered.
- Video duration at least 5 seconds.
- No obvious camera interruption.

Future implementations may replace mocked quality signals with frame analysis or platform-specific face detection.

## 5. Local Biometric Authentication

Use `expo-local-authentication` as an optional device-owner confirmation signal.

Expected result categories:

- Supported and authenticated.
- Supported but failed.
- Supported but canceled.
- Unsupported.
- Not enrolled.
- Temporarily unavailable.

Important boundary:

- This does not prove the captured face is the same person as the device owner.
- This does not expose Face ID templates, enrolled face data, or Apple's Face ID matching internals.
- This result should lower risk slightly when successful, but must not replace liveness challenge or capture quality checks.

## 6. Cross-Platform Liveness Challenge

The cross-platform MVP liveness method is an action challenge.

Recommended challenge set:

- Blink.
- Turn head left/right.
- Open mouth.

For MVP implementation, use one or two randomized prompts per session. If real-time face gesture detection is not available, the app can use timed user prompts and deterministic demo controls during early development, as long as the UI and scoring clearly remain demo-only.

The liveness module should return:

- Challenge type.
- Started timestamp.
- Completed timestamp.
- Pass/fail result.
- Failure reason, if any.

## 7. iOS TrueDepth Enhancement

TrueDepth is an iOS-only enhancement, not an MVP blocker.

Correct capability boundary:

- iOS apps can access TrueDepth camera/depth and ARKit face tracking through native Apple APIs.
- Expo Camera does not directly expose TrueDepth depth data or ARKit face tracking.
- The app cannot access Face ID enrollment data, identity templates, or Apple's internal Face ID identity matching.

Recommended implementation path:

1. Keep MVP in Expo-managed React code.
2. Add an iOS native Expo Module when TrueDepth is prioritized.
3. Use a development build through EAS.
4. Expose only minimal derived signals to JavaScript, not raw sensitive streams by default.

Suggested native-derived signals:

- `depthAvailable`: whether TrueDepth depth data is available.
- `faceDepthVariance`: rough depth variation across the detected face region.
- `facePoseStable`: whether face pose is trackable and consistent.
- `challengeMotionMatched`: whether head movement matched the prompt.
- `presentationAttackSuspected`: boolean or risk contribution.

TrueDepth should improve confidence but must degrade gracefully on unsupported devices.

## 8. Android Fallback

Android does not have a universal equivalent to iOS TrueDepth. The app should use:

- `expo-local-authentication` for optional biometric authentication where available.
- Action challenge liveness.
- Video duration and quality checks.
- Manual review state when signals are mixed.

No Android feature should block the whole MVP unless camera or microphone access is unavailable.

## 9. Mock Scoring Engine

The scoring engine should be deterministic and explainable.

Inputs:

- Capture quality signals.
- Liveness challenge result.
- Biometric result.
- TrueDepth enhancement signals, when available.
- Retry count.

Outputs:

- Numeric risk score.
- Decision: pass, retry, or manual review.
- Human-readable reasons.

The engine must be local and must not send data over the network.

## 10. Error Handling

Required recoverable errors:

- Camera permission denied.
- Microphone permission denied.
- Camera unavailable.
- Recording failed.
- Video shorter than 5 seconds.
- Biometric prompt canceled.
- Biometric unsupported.
- Liveness challenge timeout.
- File artifact unavailable.

All errors should provide a next action:

- Retry.
- Open settings.
- Continue without optional biometric.
- Restart session.

## 11. Build and Verification Notes

- Expo Go can validate most React UI and basic camera behavior.
- Face ID usage requires `NSFaceIDUsageDescription`.
- Face ID, custom native modules, and TrueDepth enhancement should be verified with an Expo development build.
- TrueDepth must be tested on a supported iPhone with a TrueDepth front camera.
- Android biometric behavior must be tested on a real enrolled device.
