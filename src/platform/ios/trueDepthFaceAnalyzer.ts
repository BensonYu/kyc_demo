import { manualReviewFaceAnalyzer } from '../fallback/manualReviewAnalyzer';
import type { FaceAnalyzer } from '../types';

export const iosTrueDepthFaceAnalyzer: FaceAnalyzer = {
  async analyzeCapture(input) {
    const fallback = await manualReviewFaceAnalyzer.analyzeCapture(input);

    return {
      ...fallback,
      reasons: [
        'TrueDepth 原生照片质量分析待接入，本轮使用人工照片确认作为安全回退。',
        '此路线不会给 TrueDepth 加分，也不会声称已经完成深度活体。',
      ],
    };
  },
};
