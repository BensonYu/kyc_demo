import { requireOptionalNativeModule } from 'expo';

import type { MlKitFaceAnalysis, NormalizedFaceBox } from './KycFaceAnalyzer.types';

export type KycFaceAnalyzerModule = {
  analyzeFaceCaptureAsync(photoUri: string, guideBox: NormalizedFaceBox): Promise<MlKitFaceAnalysis>;
};

export default requireOptionalNativeModule<KycFaceAnalyzerModule>('KycFaceAnalyzer');
