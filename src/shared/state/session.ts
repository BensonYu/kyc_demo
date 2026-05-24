import type { KycSession } from '../types/kyc';

export function createInitialSession(): KycSession {
  const now = new Date().toISOString();

  return {
    id: `kyc-${Date.now()}`,
    createdAt: now,
    retryCount: 0,
    permissions: {
      cameraGranted: false,
      microphoneGranted: false,
    },
    capture: {
      videoDurationSeconds: 0,
      cameraInterrupted: false,
    },
    quality: {
      faceDetected: true,
      singleFace: true,
      faceCentered: true,
      brightnessOk: true,
      blurOk: true,
      occlusionOk: true,
    },
    trueDepth: {
      supported: false,
      available: false,
    },
  };
}
