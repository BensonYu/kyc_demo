import { Platform } from 'react-native';

import { androidFaceAnalyzer } from './android/faceAnalyzer';
import { androidLivenessAnalyzer } from './android/livenessAnalyzer';
import { iosFaceAnalyzer } from './ios/faceAnalyzer';
import { iosLivenessAnalyzer } from './ios/livenessAnalyzer';
import { iosTrueDepthProvider } from './ios/trueDepthProvider';
import { manualReviewFaceAnalyzer, fallbackLivenessAnalyzer } from './fallback/manualReviewAnalyzer';
import { unavailableTrueDepthProvider } from './fallback/trueDepthProvider';
import type { PlatformCapabilities } from './types';

export function getPlatformCapabilities(): PlatformCapabilities {
  if (Platform.OS === 'ios') {
    return {
      route: 'ios',
      face: iosFaceAnalyzer,
      liveness: iosLivenessAnalyzer,
      trueDepth: iosTrueDepthProvider,
    };
  }

  if (Platform.OS === 'android') {
    return {
      route: 'android',
      face: androidFaceAnalyzer,
      liveness: androidLivenessAnalyzer,
      trueDepth: unavailableTrueDepthProvider,
    };
  }

  return {
    route: 'fallback',
    face: manualReviewFaceAnalyzer,
    liveness: fallbackLivenessAnalyzer,
    trueDepth: unavailableTrueDepthProvider,
  };
}

