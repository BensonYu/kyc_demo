import type { KycVerificationRoute } from '../types/kyc';

export const IOS_VERIFICATION_ROUTES: KycVerificationRoute[] = ['ios_mlkit', 'ios_truedepth'];

export function shouldShowRouteSelection(platformOS: string): boolean {
  return platformOS === 'ios';
}

export function getDefaultVerificationRoute(platformOS: string): KycVerificationRoute {
  if (platformOS === 'android') {
    return 'android_mlkit';
  }

  if (platformOS === 'ios') {
    return 'ios_mlkit';
  }

  return 'manual_fallback';
}

export function getAvailableVerificationRoutes(platformOS: string): KycVerificationRoute[] {
  if (platformOS === 'ios') {
    return [...IOS_VERIFICATION_ROUTES];
  }

  return [getDefaultVerificationRoute(platformOS)];
}
