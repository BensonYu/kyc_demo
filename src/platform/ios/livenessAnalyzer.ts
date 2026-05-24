import { fallbackLivenessAnalyzer } from '../fallback/manualReviewAnalyzer';
import type { LivenessAnalyzer } from '../types';

export const iosLivenessAnalyzer: LivenessAnalyzer = {
  async analyzeLiveness(signal) {
    // TODO: Verify silent/action liveness with ARKit or AVFoundation TrueDepth signals.
    return fallbackLivenessAnalyzer.analyzeLiveness(signal);
  },
};

