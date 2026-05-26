export type NormalizedFaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AndroidMlKitFaceAnalysis = {
  provider: 'android_mlkit';
  platformRoute: 'android';
  faceDetected: boolean;
  singleFace: boolean;
  faceCentered: boolean;
  brightnessOk: boolean;
  blurOk: boolean;
  occlusionOk: boolean;
  faceCount: number;
  faceBox?: NormalizedFaceBox;
  imageSize?: {
    width: number;
    height: number;
  };
  faceAreaRatio?: number;
  headYaw?: number;
  headRoll?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  confidence: number;
  reasons: string[];
};
