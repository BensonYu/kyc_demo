import { describe, expect, it } from 'vitest';

import { getAvailableVerificationRoutes, getDefaultVerificationRoute, shouldShowRouteSelection } from './routes';

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
});
