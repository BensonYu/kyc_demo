# KYC Demo Technical Design

## 1. Architecture Summary

The app is a React + Expo mobile application with no backend. It runs the full demo KYC flow locally on the device.

Core modules:

- App shell and navigation.
- Permission manager.
- Camera capture module.
- Capture review module.
- Liveness challenge module.
- Local quality check module.
- Mock scoring engine.
- Result presentation.

Recommended libraries:

- React Native through Expo.
- `expo-camera` for camera preview, still photo capture, and 5-second video recording.
- `expo-file-system` for local session artifact handling.
- Expo development build for future native modules beyond Expo Go.

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
| `captureReview` | User confirms photo quality before liveness. |
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
- Photo quality review result.
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

MVP quality signals come from explicit photo review. Future implementations should replace review with in-house frame analysis, platform-native face detection, and liveness checks rather than third-party KYC SDKs.

## 5. Device Biometrics Boundary

Do not use Face ID, Touch ID, or Android device biometrics as a KYC signal in MVP.

Important boundary:

- Device biometrics only authenticate the device owner to the OS.
- They do not prove the person in the camera frame is alive or is the same person.
- The app cannot access Face ID templates, enrolled face data, or Apple's Face ID matching internals.
- If device-owner authentication is ever added later, it must be labeled as device confirmation, not KYC liveness or identity verification.

## 6. Cross-Platform Liveness Challenge

The cross-platform MVP liveness method is an action challenge.

The next production-oriented direction is an in-house liveness module with two modes:

- Silent liveness: passive checks from camera frames, face box stability, brightness, blur, motion continuity, depth when available, and presentation-attack signals.
- Action liveness: randomized prompts such as blink, open mouth, turn head, nod, or shake head, verified from platform-native face landmarks/pose/depth signals.

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
- TrueDepth enhancement must not be described as calling Face ID.

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

- Android native ML Kit face detection for face box, landmarks, eye-open probability, and pose signals.
- Action challenge liveness verified from Android-native signals.
- Video duration and quality checks.
- Manual review state when signals are mixed.

No Android feature should block the whole MVP unless camera or microphone access is unavailable.

## 9. Mock Scoring Engine

The scoring engine should be deterministic and explainable.

Inputs:

- Capture quality signals.
- Liveness challenge result.
- TrueDepth enhancement signals, when available.
- Retry count.

Outputs:

- Numeric risk score.
- Decision: pass, retry, or manual review.
- Human-readable reasons.

The engine must be local and must not send data over the network.

## 10. Platform Code Organization

When native liveness work starts, split the code by capability layer, not by duplicating the entire product flow.

Recommended structure:

```text
src/
  shared/
    components/
    screens/
    state/
    services/
    types/
  platform/
    android/
      faceAnalyzer.ts
      livenessAnalyzer.ts
      cameraProvider.ts
    ios/
      faceAnalyzer.ts
      livenessAnalyzer.ts
      trueDepthProvider.ts
      cameraProvider.ts
    fallback/
      manualReviewAnalyzer.ts
```

Rules:

- Keep the KYC flow, reducer/state machine, scoring, result copy, and shared UI in `src/shared`.
- Put only OS-specific capture and analysis implementations in `src/platform/android` and `src/platform/ios`.
- Add a platform resolver that chooses iOS, Android, or fallback providers based on `Platform.OS` and capability checks.
- Keep provider outputs normalized so the shared flow can consume the same `QualitySignals`, liveness result, and scoring contract.

## 11. Error Handling

Required recoverable errors:

- Camera permission denied.
- Microphone permission denied.
- Camera unavailable.
- Recording failed.
- Video shorter than 5 seconds.
- Liveness challenge timeout.
- File artifact unavailable.

All errors should provide a next action:

- Retry.
- Open settings.
- Restart session.

## 12. Build and Verification Notes

- Expo Go can validate most React UI and basic camera behavior.
- Custom native modules and TrueDepth enhancement should be verified with an Expo development build.
- TrueDepth must be tested on a supported iPhone with a TrueDepth front camera.
- See `docs/HANDOFF.md` for the recommended next-phase plan for Android ML Kit, VisionCamera face detector, and iOS TrueDepth integration.
