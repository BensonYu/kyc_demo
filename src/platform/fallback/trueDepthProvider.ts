import type { TrueDepthProvider } from '../types';

export const unavailableTrueDepthProvider: TrueDepthProvider = {
  async getSignals() {
    return {
      supported: false,
      available: false,
    };
  },
};

