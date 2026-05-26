# KYC Demo Rules and Scoring

## 1. Purpose

This document defines local heuristic rules for the KYC demo. These rules are deterministic demo logic, not production KYC, fraud detection, or biometric identity verification.

The scoring engine produces three possible decisions:

- `pass`: the session looks acceptable for a demo.
- `retry`: the user must capture again or repeat liveness.
- `manual_review`: the session has mixed signals that would require review in a real product.

## 2. Input Signals

### Required Capture Signals

| Signal | Type | Description |
| --- | --- | --- |
| `photoCaptured` | boolean | A face photo URI exists. |
| `videoCaptured` | boolean | A selfie video URI exists. |
| `videoDurationSeconds` | number | Selfie video duration. Target is at least 5 seconds. |
| `cameraInterrupted` | boolean | Camera session was interrupted during capture. |

### Quality Signals

| Signal | Type | Description |
| --- | --- | --- |
| `faceDetected` | boolean | At least one face is present. |
| `singleFace` | boolean | Exactly one face is present. |
| `faceCentered` | boolean | Face is inside the guide frame. |
| `brightnessOk` | boolean | Lighting is sufficient. |
| `blurOk` | boolean | Face is not too blurry. |
| `occlusionOk` | boolean | No major occlusion such as mask, hand, or sunglasses. |

### ML Kit Post-Capture Signals

These signals are produced by the local Expo Module when Android or iOS ML Kit is available:

| Signal | Type | Description |
| --- | --- | --- |
| `provider` | enum | `android_mlkit` or `ios_mlkit` when the native module completed analysis. |
| `faceCount` | number | Number of faces detected in the captured still photo. |
| `faceBox` | object | Normalized detected face rectangle in image coordinates. |
| `imageSize` | object | Width and height of the analyzed image. |
| `faceAreaRatio` | number | Face box area divided by image area. |
| `headYaw` | number | Horizontal head rotation from ML Kit. |
| `headRoll` | number | Roll angle from ML Kit. |
| `leftEyeOpenProbability` | number | Optional ML Kit classification output. |
| `rightEyeOpenProbability` | number | Optional ML Kit classification output. |
| `confidence` | number | Demo confidence for this capture-quality check. |
| `reasons` | string[] | Human-readable analysis notes. |

ML Kit post-capture rules:

- If `faceCount === 0`, block and require retake.
- If `faceCount > 1`, block and require retake.
- If the normalized `faceBox` is outside the guide frame, block and require retake.
- If `faceAreaRatio < 0.12`, block and ask the user to move closer.
- If `faceAreaRatio > 0.62`, block and ask the user to move farther away.
- If `abs(headYaw) > 22` or `abs(headRoll) > 18`, block and ask the user to face the camera.
- If eye-open probabilities are unavailable but other checks pass, do not block; note lower confidence for later action liveness.

Unsupported native analysis is neutral and falls back to manual review; it must not silently pass. ML Kit is used as a local vision primitive only, not a third-party KYC decision engine.

### Verification Routes

| Route | Platform | Behavior |
| --- | --- | --- |
| `android_mlkit` | Android | Uses the Android ML Kit post-capture analyzer when the local module is available. |
| `ios_mlkit` | iOS | Uses the iOS ML Kit post-capture analyzer when the local module is available. |
| `ios_truedepth` | iOS | Current milestone only marks the TrueDepth route and uses manual photo confirmation fallback. It must not add TrueDepth scoring credit until native depth/face-tracking signals exist. |
| `manual_fallback` | Unsupported/Expo Go | Uses explicit manual photo confirmation and contributes no automatic face-analysis pass. |

### Liveness Signals

| Signal | Type | Description |
| --- | --- | --- |
| `challengeType` | enum | `blink`, `turn_head`, `open_mouth`, or combined challenge. |
| `challengeCompleted` | boolean | User completed the requested action. |
| `challengeTimeout` | boolean | Challenge exceeded time limit. |
| `challengeAttempts` | number | Number of attempts in the session. |

### iOS TrueDepth Enhancement Signals

These signals are optional and iOS-only:

| Signal | Type | Description |
| --- | --- | --- |
| `trueDepthAvailable` | boolean | Device and native module support TrueDepth depth or face tracking. |
| `faceDepthConsistent` | boolean | Face region has plausible 3D depth variation. |
| `facePoseTrackable` | boolean | Face pose can be tracked reliably. |
| `challengeMotionMatched` | boolean | Depth or ARKit face tracking confirms the challenge motion. |
| `presentationAttackSuspected` | boolean | Native signal indicates possible spoofing. |

TrueDepth signals modify risk when available. Unsupported devices must not be penalized.

## 3. Blocking Retry Rules

Return `retry` immediately if any blocking condition is true:

- `photoCaptured` is false.
- `videoCaptured` is false.
- `videoDurationSeconds < 5`.
- `cameraInterrupted` is true.
- `faceDetected` is false.
- `singleFace` is false.
- ML Kit reports face outside the guide frame, face too small/large, or excessive pose angle.
- `challengeCompleted` is false.
- `challengeTimeout` is true.

Recommended retry reasons:

- "未检测到人脸，请重新拍摄。"
- "检测到多张人脸，请确保画面中只有本人。"
- "自拍视频不足 5 秒，请重新录制。"
- "活体动作未完成，请重试。"
- "摄像头被中断，请重新开始。"

## 4. Risk Score

Start at `0`. Add risk points for weak or failed signals:

| Condition | Risk Points |
| --- | ---: |
| Face not centered | +10 |
| Lighting too dark or too bright | +15 |
| Blur too high | +20 |
| Occlusion detected | +20 |
| Challenge required more than one attempt | +10 |
| Retry count is 1 | +10 |
| Retry count is 2 or more | +20 |
| TrueDepth available and face depth inconsistent | +25 |
| TrueDepth available and challenge motion not matched | +25 |
| Presentation attack suspected | +50 |

Subtract confidence points for strong signals:

| Condition | Risk Points |
| --- | ---: |
| Face centered | -5 |
| Brightness acceptable | -5 |
| Blur acceptable | -5 |
| Occlusion acceptable | -5 |
| TrueDepth available and depth consistent | -15 |
| TrueDepth available and challenge motion matched | -15 |

Clamp final score to `0-100`.

## 5. Decision Thresholds

After blocking retry checks:

| Score Range | Decision |
| --- | --- |
| `0-29` | `pass` |
| `30-59` | `manual_review` |
| `60-100` | `retry` |

Manual review should include reasons explaining which signals were weak. Retry should include the most actionable issue first.

## 6. Demo Scenario Presets

Use deterministic presets during development and demos:

### Happy Path

- Photo and video captured.
- Video duration is 5 seconds or more.
- Single centered face.
- Lighting, blur, and occlusion all acceptable.
- Liveness challenge passes on first attempt.
- Expected decision: `pass`.

### Poor Quality Retry

- Photo and video captured.
- Video duration is 5 seconds or more.
- Single face detected.
- Blur or lighting fails.
- Liveness passes.
- Expected decision: `manual_review` or `retry`, depending on score.

### Liveness Failure

- Photo and video captured.
- Video duration is 5 seconds or more.
- Single face detected.
- Liveness challenge times out or fails.
- Expected decision: `retry`.

### Mixed Signals

- Photo and video captured.
- Single face detected.
- Liveness passes after a retry.
- One quality signal is weak.
- Expected decision: `manual_review`.

### TrueDepth Enhanced Pass

- iOS supported device.
- TrueDepth available.
- Face depth is consistent.
- Challenge motion matches.
- Other required signals pass.
- Expected decision: `pass` with lower risk.

## 7. Explainability Requirements

Each result should include:

- Final decision.
- Numeric risk score.
- Primary reason.
- Secondary reasons, if any.
- Next action: finish, retry, or review.

The result copy must avoid production claims. Prefer "本地演示校验通过" over "身份认证通过".
