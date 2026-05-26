import { describe, expect, it, vi } from 'vitest';

import { getPlatformCapabilities } from './index';

const platformMock = vi.hoisted(() => ({
  Platform: {
    OS: 'ios',
  },
}));

vi.mock('react-native', () => platformMock);
vi.mock('../../modules/kyc-face-analyzer/src/KycFaceAnalyzerModule', () => ({
  default: null,
}));

describe('platform capabilities resolver', () => {
  it('selects the iOS ML Kit route by default on iOS', () => {
    setPlatformOS('ios');

    const capabilities = getPlatformCapabilities('ios_mlkit');

    expect(capabilities.route).toBe('ios');
    expect(capabilities.face).toBeDefined();
  });

  it('selects the iOS TrueDepth route when requested', () => {
    setPlatformOS('ios');

    const capabilities = getPlatformCapabilities('ios_truedepth');

    expect(capabilities.route).toBe('ios');
    expect(capabilities.face).toBeDefined();
    expect(capabilities.trueDepth).toBeDefined();
  });

  it('selects Android ML Kit route on Android', () => {
    setPlatformOS('android');

    const capabilities = getPlatformCapabilities('android_mlkit');

    expect(capabilities.route).toBe('android');
  });

  it('honors manual fallback route even on native platforms', () => {
    setPlatformOS('ios');

    const capabilities = getPlatformCapabilities('manual_fallback');

    expect(capabilities.route).toBe('fallback');
  });
});

function setPlatformOS(os: 'ios' | 'android' | 'web') {
  platformMock.Platform.OS = os;
}
