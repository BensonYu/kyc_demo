import { unavailableTrueDepthProvider } from '../fallback/trueDepthProvider';
import type { TrueDepthProvider } from '../types';

export const iosTrueDepthProvider: TrueDepthProvider = {
  async getSignals() {
    // TODO: Replace with an iOS Expo Module backed by ARKit or AVFoundation TrueDepth APIs.
    return unavailableTrueDepthProvider.getSignals();
  },
};

