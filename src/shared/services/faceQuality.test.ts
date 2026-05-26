import { describe, expect, it } from 'vitest';

import { getQualitySignals, isCaptureAnalysisPassing, isFaceBoxInsideGuide } from './faceQuality';
import type { FaceQualityResult } from '../types/kyc';

describe('faceQuality helpers', () => {
  it('passes only native successful analysis', () => {
    expect(isCaptureAnalysisPassing(makeResult())).toBe(true);
    expect(isCaptureAnalysisPassing(makeResult({ provider: 'manual_review', confidence: 0 }))).toBe(false);
    expect(isCaptureAnalysisPassing(makeResult({ faceCentered: false }))).toBe(false);
    expect(isCaptureAnalysisPassing(makeResult({ faceAreaRatio: 0.05 }))).toBe(false);
    expect(isCaptureAnalysisPassing(makeResult({ headYaw: 30 }))).toBe(false);
  });

  it('maps analyzer output to scoring quality signals', () => {
    const quality = getQualitySignals(makeResult({ blurOk: false }));

    expect(quality).toEqual({
      faceDetected: true,
      singleFace: true,
      faceCentered: true,
      brightnessOk: true,
      blurOk: false,
      occlusionOk: true,
    });
  });

  it('checks whether the detected face box is inside the guide box', () => {
    expect(isFaceBoxInsideGuide({ x: 0.25, y: 0.25, width: 0.3, height: 0.32 }, { x: 0.2, y: 0.2, width: 0.6, height: 0.6 })).toBe(
      true,
    );
    expect(isFaceBoxInsideGuide({ x: 0.05, y: 0.25, width: 0.3, height: 0.32 }, { x: 0.2, y: 0.2, width: 0.6, height: 0.6 })).toBe(
      false,
    );
  });
});

function makeResult(patch: Partial<FaceQualityResult> = {}): FaceQualityResult {
  return {
    provider: 'android_mlkit',
    platformRoute: 'android',
    faceDetected: true,
    singleFace: true,
    faceCentered: true,
    brightnessOk: true,
    blurOk: true,
    occlusionOk: true,
    confidence: 0.9,
    reasons: [],
    ...patch,
  };
}
