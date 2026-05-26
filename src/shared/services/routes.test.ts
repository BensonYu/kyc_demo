import { describe, expect, it } from 'vitest';

import { getAvailableVerificationRoutes, getDefaultVerificationRoute, getStartDestination, shouldShowRouteSelection } from './routes';
import { KYC_CONSENT_VERSION, type KycLocalPreferences } from './localPreferencesModel';

describe('route helpers', () => {
  it('shows iOS route selection with ML Kit and TrueDepth routes', () => {
    expect(shouldShowRouteSelection('ios')).toBe(true);
    expect(getAvailableVerificationRoutes('ios')).toEqual(['ios_mlkit', 'ios_truedepth']);
    expect(getDefaultVerificationRoute('ios')).toBe('ios_mlkit');
  });

  it('does not show route selection on Android', () => {
    expect(shouldShowRouteSelection('android')).toBe(false);
    expect(getAvailableVerificationRoutes('android')).toEqual(['android_mlkit']);
    expect(getDefaultVerificationRoute('android')).toBe('android_mlkit');
  });

  it('uses manual fallback on unsupported platforms', () => {
    expect(shouldShowRouteSelection('web')).toBe(false);
    expect(getAvailableVerificationRoutes('web')).toEqual(['manual_fallback']);
    expect(getDefaultVerificationRoute('web')).toBe('manual_fallback');
  });

  it('starts at consent when local consent has not been accepted', () => {
    expect(
      getStartDestination({
        platformOS: 'android',
        permissions: grantedPermissions,
      }),
    ).toBe('consent');
  });

  it('starts at consent when consent version is stale', () => {
    expect(
      getStartDestination({
        platformOS: 'android',
        preferences: makePreferences({ consentVersion: KYC_CONSENT_VERSION - 1 }),
        permissions: grantedPermissions,
      }),
    ).toBe('consent');
  });

  it('starts at permissions when consent is current but a system permission is missing', () => {
    expect(
      getStartDestination({
        platformOS: 'android',
        preferences: makePreferences(),
        permissions: {
          cameraGranted: true,
          microphoneGranted: false,
        },
      }),
    ).toBe('permissions');
  });

  it('starts at camera on Android when consent and permissions are ready', () => {
    expect(
      getStartDestination({
        platformOS: 'android',
        preferences: makePreferences(),
        permissions: grantedPermissions,
      }),
    ).toBe('camera');
  });

  it('starts at route selection on iOS when consent and permissions are ready', () => {
    expect(
      getStartDestination({
        platformOS: 'ios',
        preferences: makePreferences(),
        permissions: grantedPermissions,
      }),
    ).toBe('routeSelection');
  });
});

const grantedPermissions = {
  cameraGranted: true,
  microphoneGranted: true,
};

function makePreferences(patch: Partial<KycLocalPreferences> = {}): KycLocalPreferences {
  return {
    consentAccepted: true,
    consentVersion: KYC_CONSENT_VERSION,
    lastPermissions: grantedPermissions,
    updatedAt: '2026-05-26T00:00:00.000Z',
    ...patch,
  };
}
