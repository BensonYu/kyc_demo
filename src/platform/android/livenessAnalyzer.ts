import { fallbackLivenessAnalyzer } from '../fallback/manualReviewAnalyzer';
import type { LivenessAnalyzer } from '../types';

export const androidLivenessAnalyzer: LivenessAnalyzer = {
  async analyzeLiveness(signal) {
    // TODO: Verify blink/open-mouth/head-turn prompts with ML Kit or VisionCamera frame signals.
    return fallbackLivenessAnalyzer.analyzeLiveness(signal);
  },
};

