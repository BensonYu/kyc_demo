import { manualReviewFaceAnalyzer } from '../fallback/manualReviewAnalyzer';
import type { FaceAnalyzer } from '../types';

export const iosFaceAnalyzer: FaceAnalyzer = {
  async analyzeCapture(input) {
    // TODO: Replace with Vision/ARKit/TrueDepth-derived face quality signals.
    return manualReviewFaceAnalyzer.analyzeCapture(input);
  },
};

