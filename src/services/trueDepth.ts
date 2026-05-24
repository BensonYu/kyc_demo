import type { TrueDepthSignals } from '../types/kyc';

export async function getTrueDepthSignals(): Promise<TrueDepthSignals> {
  return {
    supported: false,
    available: false,
  };
}

