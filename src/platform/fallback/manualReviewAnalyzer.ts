import type { FaceAnalyzer, LivenessAnalyzer } from '../types';

export const manualReviewFaceAnalyzer: FaceAnalyzer = {
  async analyzeCapture() {
    return {
      provider: 'manual_review',
      platformRoute: 'fallback',
      faceDetected: false,
      singleFace: false,
      faceCentered: false,
      brightnessOk: false,
      blurOk: false,
      occlusionOk: false,
      confidence: 0,
      reasons: ['Native face analysis is unavailable. Use manual photo review.'],
    };
  },
};

export const fallbackLivenessAnalyzer: LivenessAnalyzer = {
  async analyzeLiveness(signal) {
    return {
      provider: 'manual_review',
      platformRoute: 'fallback',
      mode: 'action',
      passed: signal.challengeCompleted && !signal.challengeTimeout,
      challengeType: signal.challengeType,
      confidence: signal.challengeCompleted && !signal.challengeTimeout ? 0.5 : 0,
      reasons: ['Native liveness analysis is unavailable. Using demo challenge result.'],
    };
  },
};

