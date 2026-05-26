import type { FaceQualityResult, NormalizedFaceBox, QualitySignals } from '../types/kyc';

export const SELFIE_GUIDE_BOX: NormalizedFaceBox = {
  x: 0.18,
  y: 0.18,
  width: 0.64,
  height: 0.58,
};

const PASSING_PROVIDERS: FaceQualityResult['provider'][] = ['android_mlkit', 'ios_mlkit', 'vision_camera'];
const MIN_FACE_AREA_RATIO = 0.12;
const MAX_FACE_AREA_RATIO = 0.62;
const MAX_HEAD_YAW = 22;
const MAX_HEAD_ROLL = 18;

export function getQualitySignals(result: FaceQualityResult): QualitySignals {
  return {
    faceDetected: result.faceDetected,
    singleFace: result.singleFace,
    faceCentered: result.faceCentered,
    brightnessOk: result.brightnessOk,
    blurOk: result.blurOk,
    occlusionOk: result.occlusionOk,
  };
}

export function isNativeAnalysisAvailable(result?: FaceQualityResult): result is FaceQualityResult {
  return Boolean(result && PASSING_PROVIDERS.includes(result.provider) && result.confidence > 0);
}

export function isCaptureAnalysisPassing(result?: FaceQualityResult): boolean {
  if (!isNativeAnalysisAvailable(result)) {
    return false;
  }

  return (
    result.faceDetected &&
    result.singleFace &&
    result.faceCentered &&
    result.brightnessOk &&
    result.blurOk &&
    result.occlusionOk &&
    isFaceAreaAcceptable(result.faceAreaRatio) &&
    isHeadPoseAcceptable(result.headYaw, result.headRoll)
  );
}

export function isFaceBoxInsideGuide(faceBox: NormalizedFaceBox, guideBox: NormalizedFaceBox, tolerance = 0.04): boolean {
  const faceLeft = faceBox.x;
  const faceTop = faceBox.y;
  const faceRight = faceBox.x + faceBox.width;
  const faceBottom = faceBox.y + faceBox.height;
  const guideLeft = guideBox.x - tolerance;
  const guideTop = guideBox.y - tolerance;
  const guideRight = guideBox.x + guideBox.width + tolerance;
  const guideBottom = guideBox.y + guideBox.height + tolerance;

  return faceLeft >= guideLeft && faceTop >= guideTop && faceRight <= guideRight && faceBottom <= guideBottom;
}

function isFaceAreaAcceptable(faceAreaRatio?: number): boolean {
  return faceAreaRatio === undefined || (faceAreaRatio >= MIN_FACE_AREA_RATIO && faceAreaRatio <= MAX_FACE_AREA_RATIO);
}

function isHeadPoseAcceptable(headYaw?: number, headRoll?: number): boolean {
  return (
    (headYaw === undefined || Math.abs(headYaw) <= MAX_HEAD_YAW) &&
    (headRoll === undefined || Math.abs(headRoll) <= MAX_HEAD_ROLL)
  );
}
