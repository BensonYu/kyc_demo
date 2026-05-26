import { requireOptionalNativeModule } from 'expo';

import type { AndroidMlKitFaceAnalysis, NormalizedFaceBox } from './KycFaceAnalyzer.types';

export type KycFaceAnalyzerModule = {
  analyzeFaceCaptureAsync(photoUri: string, guideBox: NormalizedFaceBox): Promise<AndroidMlKitFaceAnalysis>;
};

export default requireOptionalNativeModule<KycFaceAnalyzerModule>('KycFaceAnalyzer');
