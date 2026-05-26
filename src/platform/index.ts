import { Platform } from 'react-native';

import { androidFaceAnalyzer } from './android/faceAnalyzer';
import { androidLivenessAnalyzer } from './android/livenessAnalyzer';
import { iosFaceAnalyzer } from './ios/faceAnalyzer';
import { iosLivenessAnalyzer } from './ios/livenessAnalyzer';
import { iosTrueDepthFaceAnalyzer } from './ios/trueDepthFaceAnalyzer';
import { iosTrueDepthProvider } from './ios/trueDepthProvider';
import { manualReviewFaceAnalyzer, fallbackLivenessAnalyzer } from './fallback/manualReviewAnalyzer';
import { unavailableTrueDepthProvider } from './fallback/trueDepthProvider';
import type { KycVerificationRoute, PlatformCapabilities } from './types';

export function getPlatformCapabilities(route?: KycVerificationRoute): PlatformCapabilities {
  if (route === 'manual_fallback') {
    return {
      route: 'fallback',
      face: manualReviewFaceAnalyzer,
      liveness: fallbackLivenessAnalyzer,
      trueDepth: unavailableTrueDepthProvider,
    };
  }

  if (Platform.OS === 'ios') {
    if (route === 'ios_truedepth') {
      return {
        route: 'ios',
        face: iosTrueDepthFaceAnalyzer,
        liveness: iosLivenessAnalyzer,
        trueDepth: iosTrueDepthProvider,
      };
    }

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
