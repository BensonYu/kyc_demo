# KYC Demo Agent Guide

## Project Mission

Build a high-fidelity front-end KYC demo with React and Expo. The product must complete a minimal end-to-end KYC-like flow on device without backend support:

1. Ask for privacy consent and camera/microphone permissions.
2. Capture a face photo.
3. Record a 5-second selfie video.
4. Run post-capture face quality analysis, with manual review fallback when native analysis is unavailable.
5. Run a cross-platform liveness challenge.
6. Run local quality checks and mock risk scoring.
7. Show pass, retry, or manual review.

This is a demo, not a compliant production KYC system. Do not claim real identity verification, regulatory compliance, fraud accuracy, or access to Face ID identity templates.

## Hard Constraints

- Frontend only. Do not add a backend service, database, cloud storage, or network dependency for MVP.
- Use React and Expo. Prefer Expo SDK capabilities before adding native code.
- Prioritize iOS and Android real devices.
- Keep all sensitive capture artifacts local to the app sandbox or temporary storage.
- Avoid uploading photos, videos, liveness signals, or risk results.
- Treat current scoring as mock/heuristic logic for demo purposes, but design native liveness work as an in-house replacement for third-party KYC SDKs.

## Biometrics and TrueDepth Boundaries

- Do not use Face ID, Touch ID, or Android device biometrics as a KYC signal in MVP.
- `expo-local-authentication` can request system authentication, but device-owner authentication is not identity verification of the person in the camera frame.
- The app cannot access Face ID enrollment data, identity templates, or Apple's internal Face ID matching result.
- iOS apps can use TrueDepth camera/depth/face tracking data through native Apple APIs, but Expo Camera does not expose a TrueDepth/depth API directly.
- TrueDepth support must be implemented as an iOS enhancement using native code, such as an Expo Module plus an EAS development build.
- Android must use fallback liveness checks such as action challenges and video quality checks.

## Implementation Preferences

- Model the KYC flow as an explicit state machine or a small typed reducer.
- Keep capture, liveness, scoring, and result presentation separate.
- When native liveness work starts, keep shared flow code in `src/shared` and isolate OS-specific analyzers in `src/platform/ios` and `src/platform/android`.
- Android post-capture face analysis currently uses local Expo Module `modules/kyc-face-analyzer` with ML Kit; it requires a development build and must fall back cleanly in Expo Go.
- iOS post-capture face analysis uses the same local Expo Module with `GoogleMLKit/FaceDetection`; the iOS route selection screen offers ML Kit and TrueDepth routes.
- The current TrueDepth route is only a state/provider stub with manual fallback copy. Do not claim depth liveness until ARKit/AVFoundation signals are actually implemented and verified.
- Use deterministic mock scoring so pass/retry/review states can be tested.
- Prefer clear user recovery paths over silent failures.
- Keep UI copy honest: use "demo verification", "local checks", and "risk score" instead of "verified identity" until the in-house liveness implementation is production validated.

## Expected Documentation

- `docs/PRD.md`: product requirements and MVP scope.
- `docs/TECH_DESIGN.md`: React/Expo architecture, device capabilities, and TrueDepth enhancement path.
- `docs/KYC_RULES.md`: local heuristic scoring and decision states.
- `docs/UX_FLOW.md`: screens, states, and recovery paths.
- `docs/HANDOFF.md`: next-phase handoff for native ML Kit, VisionCamera face detector, and iOS TrueDepth integration.

## Test Expectations

Before considering a feature done, verify:

- Permission states: first allow, deny, return from settings.
- Camera capture: successful photo, 5-second video, cancel while recording.
- Liveness: challenge pass/fail and photo quality approval/retry.
- Scoring: pass, retry, and manual review are reproducible.
- Platform behavior: iOS and Android real devices; TrueDepth requires a development build, not Expo Go alone.
