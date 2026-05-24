export type KycStep =
  | 'idle'
  | 'consent'
  | 'permissions'
  | 'camera'
  | 'captureReview'
  | 'liveness'
  | 'processing'
  | 'result';

export type KycDecision = 'pass' | 'retry' | 'manual_review';

export type LivenessChallengeType = 'blink' | 'turn_head' | 'open_mouth';

export type CaptureArtifacts = {
  photoUri?: string;
  videoUri?: string;
  videoDurationSeconds: number;
  cameraInterrupted: boolean;
};

export type PermissionSignals = {
  cameraGranted: boolean;
  microphoneGranted: boolean;
};

export type QualitySignals = {
  faceDetected: boolean;
  singleFace: boolean;
  faceCentered: boolean;
  brightnessOk: boolean;
  blurOk: boolean;
  occlusionOk: boolean;
};

export type LivenessSignal = {
  challengeType: LivenessChallengeType;
  challengeCompleted: boolean;
  challengeTimeout: boolean;
  challengeAttempts: number;
  startedAt: string;
  completedAt?: string;
  reason?: string;
  demoPreset?: 'manual_review';
};

export type TrueDepthSignals = {
  supported: boolean;
  available: boolean;
  faceDepthConsistent?: boolean;
  facePoseTrackable?: boolean;
  challengeMotionMatched?: boolean;
  presentationAttackSuspected?: boolean;
};

export type RiskReason = {
  code: string;
  message: string;
  points?: number;
};

export type RiskScoreResult = {
  decision: KycDecision;
  score: number;
  primaryReason: string;
  reasons: RiskReason[];
};

export type KycSession = {
  id: string;
  createdAt: string;
  retryCount: number;
  permissions: PermissionSignals;
  capture: CaptureArtifacts;
  quality: QualitySignals;
  liveness?: LivenessSignal;
  trueDepth: TrueDepthSignals;
  result?: RiskScoreResult;
};

export type KycState = {
  step: KycStep;
  session: KycSession;
  isBusy: boolean;
  error?: string;
};
