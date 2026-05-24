import { manualReviewFaceAnalyzer } from '../fallback/manualReviewAnalyzer';
import type { FaceAnalyzer } from '../types';

export const androidFaceAnalyzer: FaceAnalyzer = {
  async analyzeCapture(input) {
    // TODO: Replace with an Expo Module wrapping Google ML Kit Face Detection.
    return manualReviewFaceAnalyzer.analyzeCapture(input);
  },
};

