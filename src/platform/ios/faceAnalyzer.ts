import KycFaceAnalyzerModule from '../../../modules/kyc-face-analyzer/src/KycFaceAnalyzerModule';
import { manualReviewFaceAnalyzer } from '../fallback/manualReviewAnalyzer';
import type { FaceAnalyzer } from '../types';

export const iosFaceAnalyzer: FaceAnalyzer = {
  async analyzeCapture(input) {
    if (!input.capture.photoUri || !KycFaceAnalyzerModule?.analyzeFaceCaptureAsync) {
      return manualReviewFaceAnalyzer.analyzeCapture(input);
    }

    try {
      return await KycFaceAnalyzerModule.analyzeFaceCaptureAsync(input.capture.photoUri, input.guideBox);
    } catch (error) {
      const fallback = await manualReviewFaceAnalyzer.analyzeCapture(input);

      return {
        ...fallback,
        reasons: [
          'iOS ML Kit 照片分析暂不可用，已切换为人工照片确认。',
          error instanceof Error ? error.message : String(error ?? '未知原生模块错误。'),
        ],
      };
    }
  },
};
