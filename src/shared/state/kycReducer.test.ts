import { describe, expect, it } from 'vitest';

import { createInitialState, kycReducer } from './kycReducer';

describe('kycReducer', () => {
  it('starts a fresh session at consent', () => {
    const state = kycReducer(createInitialState(), { type: 'START' });

    expect(state.step).toBe('consent');
    expect(state.session.id).toMatch(/^kyc-/);
  });

  it('moves to camera when required permissions are granted', () => {
    const state = kycReducer(createInitialState(), {
      type: 'SET_PERMISSIONS',
      payload: {
        cameraGranted: true,
        microphoneGranted: true,
      },
    });

    expect(state.step).toBe('camera');
    expect(state.session.permissions.cameraGranted).toBe(true);
  });

  it('moves to capture review after capture completes', () => {
    const state = kycReducer(createInitialState(), {
      type: 'CAPTURE_COMPLETE',
      payload: {
        photoUri: 'file:///photo.jpg',
        videoUri: 'file:///video.mov',
        videoDurationSeconds: 5,
        cameraInterrupted: false,
      },
    });

    expect(state.step).toBe('captureReview');
    expect(state.session.capture.videoDurationSeconds).toBe(5);
  });

  it('stores post-capture face analysis without leaving review', () => {
    const captured = kycReducer(createInitialState(), {
      type: 'CAPTURE_COMPLETE',
      payload: {
        photoUri: 'file:///photo.jpg',
        videoUri: 'file:///video.mov',
        videoDurationSeconds: 5,
        cameraInterrupted: false,
      },
    });

    const analyzed = kycReducer(captured, {
      type: 'CAPTURE_ANALYSIS_COMPLETE',
      payload: {
        provider: 'android_mlkit',
        platformRoute: 'android',
        faceDetected: true,
        singleFace: true,
        faceCentered: true,
        brightnessOk: true,
        blurOk: true,
        occlusionOk: true,
        confidence: 0.9,
        reasons: ['人脸已通过 ML Kit 照片质量检查。'],
      },
    });

    expect(analyzed.step).toBe('captureReview');
    expect(analyzed.session.captureAnalysis?.provider).toBe('android_mlkit');
  });

  it('moves to liveness after capture review is approved', () => {
    const captured = kycReducer(createInitialState(), {
      type: 'CAPTURE_COMPLETE',
      payload: {
        photoUri: 'file:///photo.jpg',
        videoUri: 'file:///video.mov',
        videoDurationSeconds: 5,
        cameraInterrupted: false,
      },
    });

    const reviewed = kycReducer(captured, {
      type: 'CAPTURE_REVIEW_COMPLETE',
      payload: {
        faceDetected: true,
        singleFace: true,
        faceCentered: true,
        brightnessOk: true,
        blurOk: true,
        occlusionOk: true,
      },
    });

    expect(reviewed.step).toBe('liveness');
    expect(reviewed.session.quality.faceCentered).toBe(true);
  });

  it('keeps permissions and increments retry count on retry', () => {
    const granted = kycReducer(createInitialState(), {
      type: 'SET_PERMISSIONS',
      payload: {
        cameraGranted: true,
        microphoneGranted: true,
      },
    });

    const retried = kycReducer(granted, { type: 'RETRY' });

    expect(retried.step).toBe('camera');
    expect(retried.session.retryCount).toBe(1);
    expect(retried.session.permissions.cameraGranted).toBe(true);
  });

  it('resets to idle', () => {
    const started = kycReducer(createInitialState(), { type: 'START' });
    const reset = kycReducer(started, { type: 'RESET' });

    expect(reset.step).toBe('idle');
    expect(reset.session.retryCount).toBe(0);
  });

  it('applies manual review demo signals without changing the current step', () => {
    const state = kycReducer(createInitialState(), { type: 'APPLY_MANUAL_REVIEW_DEMO_SIGNAL' });

    expect(state.step).toBe('idle');
    expect(state.session.quality.brightnessOk).toBe(false);
    expect(state.session.quality.blurOk).toBe(false);
  });
});
