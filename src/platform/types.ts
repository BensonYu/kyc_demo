import type { CaptureArtifacts, LivenessSignal, QualitySignals, TrueDepthSignals } from '../shared/types/kyc';

export type NormalizedFaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FaceQualityResult = QualitySignals & {
  provider: 'manual_review' | 'android_mlkit' | 'vision_camera' | 'ios_truedepth';
  platformRoute: 'ios' | 'android' | 'fallback';
  faceBox?: NormalizedFaceBox;
  confidence: number;
  reasons: string[];
};

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

