# KYC Demo PRD

## 1. Product Overview

This project is a high-fidelity mobile front-end demo for a minimal KYC-like onboarding flow. It uses React and Expo, runs on iOS and Android, and does not require backend services.

The product lets a user start verification, grant device permissions, capture a face photo, record a 5-second selfie video, confirm photo quality, complete liveness checks, and receive a local demo decision: pass, retry, or manual review.

This product is not a production KYC solution. It does not verify a government identity, query watchlists, store audit records on a server, or satisfy regulatory KYC requirements.

## 2. Goals

- Complete a believable KYC demo loop with only front-end code.
- Show a polished mobile flow suitable for product demos and investor/customer walkthroughs.
- Capture the minimum evidence needed for a demo: face photo, short selfie video, photo quality confirmation, and liveness challenge result.
- Establish the product direction for an in-house liveness module that replaces third-party KYC SDKs.
- Use local mock scoring to produce understandable outcomes.
- Keep privacy boundaries explicit and avoid claiming real identity verification.

## 3. Non-Goals

- No backend, database, cloud object storage, or remote API dependency.
- No real identity document verification.
- No OCR, MRZ parsing, government database lookup, sanctions screening, or PEP screening in MVP.
- No production-grade biometric matching or fraud detection.
- No access to Face ID enrollment data, Face ID identity templates, or Apple's internal matching process.
- No use of Face ID, Touch ID, or Android device biometrics as a KYC signal.
- No third-party KYC SDK or hosted KYC provider integration. This project is intended to replace that dependency with in-house liveness capabilities.
- No permanent storage of sensitive artifacts outside the app sandbox.

## 4. Target Users

- Demo operator: runs the app and demonstrates the full KYC flow.
- End user: completes the verification flow on a mobile device.
- Product/engineering reviewer: evaluates the feasibility and UX of a front-end-only KYC experience.

## 5. MVP User Journey

1. User opens the app and sees a single primary action: "开始 KYC".
2. User reviews a short privacy and consent message.
3. App requests camera and microphone permissions.
4. On iOS, user chooses either the ML Kit face detection route or the TrueDepth enhancement route. Android uses the Android ML Kit route by default.
5. App opens the front camera.
6. User aligns their face in the frame.
7. App captures a still face photo.
8. App records a 5-second selfie video.
9. The app runs post-capture ML Kit face analysis when available, or falls back to explicit manual photo confirmation.
10. If photo quality is not acceptable, the user retakes the capture.
11. User completes one or two simple action challenges, such as blink, turn head, or open mouth.
12. App runs local quality checks and mock risk scoring.
13. App shows one of three outcomes:
   - Pass: demo verification succeeded.
   - Retry: capture quality or liveness was insufficient.
   - Manual review: signals are mixed and would require human review in a real system.

## 6. MVP Scope

### Included

- Home screen with one clear start action.
- Privacy/consent screen.
- Camera and microphone permission handling.
- Front-camera photo capture.
- 5-second selfie video recording.
- Android and iOS ML Kit post-capture face analysis in development builds.
- iOS route selection for ML Kit vs. TrueDepth enhancement.
- Photo quality review before liveness.
- Cross-platform liveness challenge.
- Local quality checks and mock risk scoring.
- Result screen with pass, retry, and manual review states.
- Retry path from failed or low-quality captures.

### Deferred

- Identity document capture.
- OCR and document authenticity checks.
- Face match between document and selfie.
- Server-side audit trail.
- Cloud storage and secure backend encryption.
- Admin review console.
- Production compliance review.

## 7. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| PRD-001 | The home screen must provide a single primary "开始 KYC" action. | Must |
| PRD-002 | The app must show privacy/consent copy before capture. | Must |
| PRD-003 | The app must request camera permission before opening the camera. | Must |
| PRD-004 | The app must request microphone permission before recording video. | Must |
| PRD-005 | The app must capture one front-camera face photo. | Must |
| PRD-006 | The app must record one 5-second front-camera selfie video. | Must |
| PRD-007 | The app must require ML Kit photo analysis or explicit photo quality confirmation before liveness. | Must |
| PRD-008 | The app must allow retake when the face is not in frame, unclear, or obstructed. | Must |
| PRD-009 | The app must run local quality checks on captured artifacts. | Must |
| PRD-010 | The app must calculate a deterministic mock risk score. | Must |
| PRD-011 | The app must show pass, retry, or manual review. | Must |
| PRD-012 | The app must provide a clear retry path. | Must |
| PRD-013 | iOS must offer ML Kit and TrueDepth routes, with TrueDepth clearly labeled as pending native enhancement until implemented. | Should |

## 8. Permissions and Privacy

Required permissions:

- Camera: face photo and selfie video capture.
- Microphone: selfie video audio track, if enabled by platform behavior.

Privacy expectations:

- All captured artifacts remain on the device for MVP.
- The app does not upload photos, videos, depth data, face tracking data, or scores.
- The app should allow deleting the current session artifacts by restarting or clearing the session.
- UI copy should describe artifacts as being used for demo checks only.

## 9. Result States

### Pass

The user completed capture, liveness challenge passed, quality score is acceptable, and local risk score is below the pass threshold.

### Retry

The app needs another capture because a blocking issue occurred, such as:

- No face detected.
- Multiple faces detected.
- Video shorter than 5 seconds.
- Face too blurry or too dark.
- Liveness challenge failed.

### Manual Review

The app captured enough evidence, but signals are mixed. In a real system, this would require human or server-side review. In the demo, this is a terminal result with an option to retry.

## 10. Success Metrics

- A first-time user can complete the flow without explanation.
- A demo operator can trigger all three result states predictably.
- Capture and result screens recover cleanly from denied permissions and failed photo quality review.
- The app avoids wording that implies real identity verification.

## 11. Open Product Extensions

- Add document capture after selfie capture.
- Add document/selfie face comparison as an in-house module or native capability.
- Add server-side encrypted audit records.
- Add admin manual review queue.
- Add iOS TrueDepth depth-based liveness enhancement.
