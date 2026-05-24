# KYC Demo Agent Guide

## Project Mission

Build a high-fidelity front-end KYC demo with React and Expo. The product must complete a minimal end-to-end KYC-like flow on device without backend support:

1. Ask for privacy consent and camera/microphone permissions.
2. Capture a face photo.
3. Record a 5-second selfie video.
4. Attempt optional system biometric authentication.
5. Run a cross-platform liveness challenge.
6. Run local quality checks and mock risk scoring.
7. Show pass, retry, or manual review.

This is a demo, not a compliant production KYC system. Do not claim real identity verification, regulatory compliance, fraud accuracy, or access to Face ID identity templates.

## Hard Constraints

- Frontend only. Do not add a backend service, database, cloud storage, or network dependency for MVP.
- Use React and Expo. Prefer Expo SDK capabilities before adding native code.
- Prioritize iOS and Android real devices.
- Keep all sensitive capture artifacts local to the app sandbox or temporary storage.
- Avoid uploading photos, videos, biometric signals, or risk results.
- Treat all scoring as mock/heuristic logic for demo purposes.

## Biometrics and TrueDepth Boundaries

- `expo-local-authentication` can request system authentication such as Face ID, Touch ID, or Android biometrics, but it only returns success/failure/cancel states.
- The app cannot access Face ID enrollment data, identity templates, or Apple's internal Face ID matching result.
- iOS apps can use TrueDepth camera/depth/face tracking data through native Apple APIs, but Expo Camera does not expose a TrueDepth/depth API directly.
- TrueDepth support must be implemented as an iOS enhancement using native code, such as an Expo Module plus an EAS development build.
- Android must gracefully use fallback liveness checks such as action challenges, video quality checks, and optional BiometricPrompt through Expo LocalAuthentication.

## Implementation Preferences

- Model the KYC flow as an explicit state machine or a small typed reducer.
- Keep capture, liveness, scoring, and result presentation separate.
- Use deterministic mock scoring so pass/retry/review states can be tested.
- Prefer clear user recovery paths over silent failures.
- Keep UI copy honest: use "demo verification", "local checks", and "risk score" instead of "verified identity" unless a real provider is added later.

## Expected Documentation

- `docs/PRD.md`: product requirements and MVP scope.
- `docs/TECH_DESIGN.md`: React/Expo architecture, device capabilities, and TrueDepth enhancement path.
- `docs/KYC_RULES.md`: local heuristic scoring and decision states.
- `docs/UX_FLOW.md`: screens, states, and recovery paths.

## Test Expectations

Before considering a feature done, verify:

- Permission states: first allow, deny, return from settings.
- Camera capture: successful photo, 5-second video, cancel while recording.
- Liveness: biometric available, unavailable, canceled, fallback challenge pass/fail.
- Scoring: pass, retry, and manual review are reproducible.
- Platform behavior: iOS and Android real devices; Face ID/TrueDepth require development builds, not Expo Go alone.
