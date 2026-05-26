import type { CaptureArtifacts, FaceQualityResult, LivenessSignal, NormalizedFaceBox, TrueDepthSignals } from '../shared/types/kyc';

export type { FaceQualityResult, NormalizedFaceBox };

export type FaceAnalyzer = {
  analyzeCapture(input: {
    capture: CaptureArtifacts;
    guideBox: NormalizedFaceBox;
  }): Promise<FaceQualityResult>;
};

export type LivenessAnalysisResult = {
  provider: FaceQualityResult['provider'];
  platformRoute: FaceQualityResult['platformRoute'];
  mode: 'silent' | 'action';
  passed: boolean;
  challengeType?: LivenessSignal['challengeType'] | 'nod' | 'shake_head';
  confidence: number;
  reasons: string[];
};

export type LivenessAnalyzer = {
  analyzeLiveness(signal: LivenessSignal): Promise<LivenessAnalysisResult>;
};

export type TrueDepthProvider = {
  getSignals(): Promise<TrueDepthSignals>;
};

export type PlatformCapabilities = {
  route: 'ios' | 'android' | 'fallback';
  face: FaceAnalyzer;
  liveness: LivenessAnalyzer;
  trueDepth: TrueDepthProvider;
};
