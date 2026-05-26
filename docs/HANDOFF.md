# KYC Demo Handoff

## Current State

- The app is an Expo SDK 56 React Native MVP with no backend.
- The flow is: consent -> permissions -> iOS route selection when applicable -> camera capture -> post-capture photo analysis/manual fallback -> liveness challenge -> local scoring -> result.
- Face ID, Touch ID, and Android device biometrics have been removed from the KYC flow. They must not be used as KYC, liveness, or identity signals.
- Expo Camera does not provide reliable face-in-frame detection in this project. Android and iOS now share a local ML Kit post-capture analyzer API; unsupported environments use a photo review screen as an explicit fallback quality gate.

## Implemented ML Kit Post-Capture Analyzer

Android and iOS post-capture milestones are now in place:

- Local Expo Module: `modules/kyc-face-analyzer`.
- Android native dependency: `com.google.mlkit:face-detection:16.1.7`.
- iOS native dependency: `GoogleMLKit/FaceDetection`.
- JS provider: `src/platform/android/faceAnalyzer.ts`.
- JS provider: `src/platform/ios/faceAnalyzer.ts`.
- Shared quality helpers: `src/shared/services/faceQuality.ts`.
- Flow integration: `src/KycApp.tsx` analyzes the captured still photo before liveness.

Behavior:

- Android development builds call ML Kit after photo/video capture.
- iOS users choose between the `ios_mlkit` route and the `ios_truedepth` route after permissions.
- The `ios_mlkit` route calls the same JS API backed by Swift and `GoogleMLKit/FaceDetection`.
- The `ios_truedepth` route is currently a route/provider stub and falls back to manual photo confirmation without adding TrueDepth scoring credit.
- Passing captures auto-advance to action liveness.
- No face, multiple faces, face outside the guide frame, face too small/large, or excessive pose angle blocks the flow and requires retake.
- If the native module is missing or throws, the app falls back to manual photo review.
- Expo Go cannot load this module; use `npx expo run:android`, `npx expo run:ios`, or EAS development builds for validation.

Current limitations:

- Brightness, blur, and occlusion are still basic placeholders in the native result.
- Face box coordinates are normalized from the captured image and drawn over the review image; real-time camera gating is still future VisionCamera work.
- This is face presence/quality analysis, not identity verification or production-grade anti-spoofing.

## Goal for Next Phase

Replace the manual photo review step with automatic face-in-frame and capture-quality checks while preserving the current scoring contract:

- Detect exactly one face.
- Confirm the face bounding box is inside the guide frame.
- Reject obvious off-frame, multi-face, blurry, dark, or obstructed captures.
- Feed deterministic quality signals into `QualitySignals` and `scoreKycSession`.
- Keep all raw photos, videos, frames, depth data, and derived signals on device.
- Build this as an in-house replacement for third-party KYC SDK behavior, not as an integration with a third-party KYC vendor.

The target liveness model has two layers:

- Silent liveness: passive signals from frames, face box stability, brightness, blur, motion continuity, depth when available, and spoof/presentation-attack heuristics.
- Action liveness: randomized prompts such as blink, open mouth, turn head, nod, or shake head, verified through face landmarks, pose, eye/mouth state, and depth/motion consistency.

Do not add third-party KYC SDKs or hosted KYC providers. Platform-native APIs and native ML libraries are acceptable because they are implementation primitives, not outsourced KYC decisions.

## Platform Routes

The project branches by phone OS and selected capability route:

- iOS ML Kit route: use local ML Kit post-capture analysis now, then Vision/VisionCamera-style real-time 2D face analysis later if needed.
- iOS TrueDepth route: current stub only; future implementation should use TrueDepth/ARKit/AVFoundation where available, with ML Kit/Vision-style 2D face analysis as fallback on unsupported devices.
- Android route: use ML Kit/VisionCamera frame processing for 2D face box, landmarks, pose, blink/open-mouth/head-turn validation, and quality gates.

Do not duplicate the whole KYC flow per platform. Keep screens, state machine, scoring, copy, and result handling in a shared layer, and isolate only the native capture-analysis providers.

## Recommended Integration Paths

### 1. Android Native ML Kit

Use Google ML Kit Face Detection in an Android native module or Expo Module.

Recommended first milestone:

- Analyze the captured photo URI before liveness.
- Return a typed result to JS with face count, normalized face box, head rotation, eye-open probabilities when available, and confidence/failure reasons.
- Replace `CaptureReviewScreen` with an automatic "checking capture quality" step on Android.
- Add action-liveness verification for blink, open mouth, and head turn using ML Kit classification/landmark/pose signals where available.

Useful signals:

- `faceDetected`
- `singleFace`
- `faceBox`
- `faceCentered`
- `faceAreaRatio`
- `headYaw`
- `headRoll`
- `leftEyeOpenProbability`
- `rightEyeOpenProbability`
- `mouthOpenProbability` or derived mouth landmark distance when available
- `qualityReasons`

Notes:

- ML Kit can detect faces and face landmarks/contours/classification signals, but it is not depth-based liveness.
- Silent liveness on Android should rely on frame continuity, pose/motion consistency, texture/quality heuristics, and action challenge validation rather than TrueDepth.
- Real-time pre-capture gating requires camera frame access; with the current Expo Camera stack, post-capture analysis is the lower-risk first step.
- A native module requires an Expo development build, not Expo Go.

Primary reference: [ML Kit Face Detection for Android](https://developers.google.com/ml-kit/vision/face-detection/android).

### 2. iOS Native ML Kit

Use Google ML Kit Face Detection in the existing iOS side of `modules/kyc-face-analyzer`.

Current milestone:

- `modules/kyc-face-analyzer/ios/KycFaceAnalyzerModule.swift` reads the captured photo URI.
- The Swift module uses accurate mode, landmarks, classification, and minimum face size.
- It returns the same normalized result contract as Android: provider, platform route, face count, face box, image size, face area ratio, pose, eye-open probabilities, confidence, and reasons.
- iOS ML Kit failures fall back to explicit manual photo confirmation rather than silently passing.

Next milestone:

- Compile and verify the Swift module with CocoaPods in an iOS development build.
- Add real-image fixture tests where practical.
- Use consecutive frame or video-derived signals for action liveness, not just post-capture still-photo analysis.

Primary reference: [ML Kit Face Detection for iOS](https://developers.google.com/ml-kit/vision/face-detection/ios).

### 3. VisionCamera Face Detector

Use `react-native-vision-camera` when real-time face-in-frame UX becomes the priority.

Recommended use:

- Replace `expo-camera` in `CameraCaptureScreen`.
- Use a Frame Processor plugin, either a maintained face detector plugin or a custom native plugin wrapping ML Kit on Android and Vision/AVFoundation on iOS.
- Draw the guide box and face box from real-time normalized frame coordinates.
- Disable the capture button until the last N frames satisfy the quality gate.
- Verify action prompts from consecutive frame signals rather than user self-confirmation.

Suggested real-time gate:

- Exactly one face for at least 700 ms.
- Face box center inside guide.
- Face box area within configured min/max range.
- Head yaw/roll below threshold.
- Brightness and blur above threshold.
- For action liveness, prompt-specific motion/landmark changes are observed across a short frame window.

Notes:

- This path is a larger migration than native post-capture ML Kit.
- It requires Expo prebuild/development builds and careful version pinning.
- Community face detector plugins should be evaluated on both Android and iOS before adoption.

Primary reference: [VisionCamera Frame Processors](https://visioncamera.margelo.com/docs/guides/frame-processors).

### 4. iOS TrueDepth Enhancement

Use an iOS Expo Module with ARKit or AVFoundation TrueDepth APIs when depth-based liveness is needed. The current milestone has only the route, state, provider contract, and unsupported fallback; it does not yet perform depth capture or AR face tracking.

Recommended use:

- Keep TrueDepth as an iOS enhancement, not a cross-platform MVP blocker.
- Expose only derived signals to JavaScript; do not stream raw depth maps unless a later product requirement needs it.
- Never describe this as calling Face ID. The app cannot access Face ID enrollment data, templates, or Apple's internal matching result.
- Use TrueDepth/ARKit/AVFoundation to strengthen both silent liveness and action liveness on supported iPhones.

Useful derived signals:

- `trueDepthAvailable`
- `faceDepthConsistent`
- `facePoseTrackable`
- `challengeMotionMatched`
- `presentationAttackSuspected`
- `blinkMatched`
- `mouthOpenMatched`
- `headTurnMatched`

Implementation options:

- ARKit `ARFaceTrackingConfiguration` for face pose, topology, and expression tracking.
- AVFoundation `builtInTrueDepthCamera` for depth data and depth consistency checks.

Primary references:

- [Apple ARFaceTrackingConfiguration](https://developer.apple.com/documentation/arkit/arfacetrackingconfiguration)
- [Apple TrueDepth depth capture](https://developer.apple.com/documentation/avfoundation/capturing-photos-with-depth)

## Suggested Interface

Add a native face analysis service behind a JS interface so the UI and scoring engine do not care which provider is active.

```ts
export type NormalizedFaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FaceQualityResult = {
  provider: 'manual_review' | 'android_mlkit' | 'ios_mlkit' | 'vision_camera' | 'ios_truedepth';
  platformRoute: 'ios' | 'android' | 'fallback';
  faceDetected: boolean;
  singleFace: boolean;
  faceCentered: boolean;
  brightnessOk: boolean;
  blurOk: boolean;
  occlusionOk: boolean;
  faceBox?: NormalizedFaceBox;
  confidence: number;
  reasons: string[];
};

export type LivenessMode = 'silent' | 'action';

export type LivenessAnalysisResult = {
  provider: FaceQualityResult['provider'];
  platformRoute: FaceQualityResult['platformRoute'];
  mode: LivenessMode;
  passed: boolean;
  challengeType?: 'blink' | 'open_mouth' | 'turn_head' | 'nod' | 'shake_head';
  confidence: number;
  reasons: string[];
};

export async function analyzeFaceCapture(input: {
  photoUri: string;
  guideBox: NormalizedFaceBox;
}): Promise<FaceQualityResult>;
```

Mapping into existing scoring:

- `faceDetected`, `singleFace`, `faceCentered`, `brightnessOk`, `blurOk`, and `occlusionOk` map directly to `QualitySignals`.
- Keep unsupported providers neutral; unsupported detection should fall back to manual review rather than silently passing.
- Scoring must continue to return `pass`, `retry`, or `manual_review` with explainable reasons.

## Recommended Code Organization

Do not split the entire flow into separate iOS and Android apps. Split only platform-specific native analysis and camera provider code.

Current structure:

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
      trueDepthFaceAnalyzer.ts
      trueDepthProvider.ts
      cameraProvider.ts
    fallback/
      manualReviewAnalyzer.ts
```

Migration guidance:

- Reusable files have already been moved into `src/shared`.
- Keep `KycApp` and the reducer shared.
- `src/platform/index.ts` already chooses iOS, Android, or fallback providers based on `Platform.OS`.
- Keep provider outputs normalized to shared `FaceQualityResult` and `LivenessAnalysisResult`.
- Avoid duplicating copy, screens, scoring thresholds, and result handling per platform.

## Code Areas to Touch

- `src/shared/screens/CameraCaptureScreen.tsx`: real-time gating or capture trigger behavior.
- `src/shared/screens/CaptureReviewScreen.tsx`: replace or keep as fallback when native analysis is unavailable.
- `src/shared/screens/RouteSelectionScreen.tsx`: iOS-only route selection between ML Kit and TrueDepth.
- `src/shared/types/kyc.ts`: extend shared quality/session signal types.
- `src/shared/services/scoring.ts`: score native quality signals without adding identity claims.
- `src/platform/android/*`: replace Android fallback analyzers with ML Kit or VisionCamera frame signals.
- `src/platform/ios/*`: replace iOS fallback analyzers with Vision/ARKit/AVFoundation/TrueDepth signals.
- `app.json`: add config plugins and native permissions only when the relevant native module is introduced.

## Acceptance Criteria

- Face outside the guide frame cannot proceed to liveness without retake or manual override.
- Multiple faces cannot proceed.
- No face cannot proceed.
- Supported Android devices can validate a captured photo with ML Kit.
- Supported iOS development builds can validate a captured photo with ML Kit.
- iOS can select either the ML Kit route or the TrueDepth route.
- Android action prompts can be verified through ML Kit/VisionCamera-derived signals.
- Unsupported devices fall back to `CaptureReviewScreen`.
- Current TrueDepth route falls back honestly and does not claim depth liveness.
- TrueDepth-supported iPhones can provide silent/action liveness signals without blocking unsupported iPhones.
- No UI copy says Face ID performs KYC, liveness, or identity verification.
- No third-party KYC SDK/provider is introduced.
- `npm run typecheck`, `npm test`, and `npx expo-doctor` pass.

## Risks and Guardrails

- Face detection is not identity verification.
- ML Kit and VisionCamera face boxes are 2D signals and can be fooled by presentation attacks.
- TrueDepth improves liveness confidence on supported iPhones, but it is not available on all devices.
- Native modules require development builds; Expo Go is not enough for MLKit frame processors or TrueDepth.
- Raw biometric-like data should stay on device and should not be logged, uploaded, or stored long-term.
- Avoid platform fork drift: shared scoring and UX must stay identical unless a platform capability genuinely changes available signals.
