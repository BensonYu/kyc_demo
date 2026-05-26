import type { KycVerificationRoute } from '../types/kyc';
import type { KycLocalPreferences } from './localPreferencesModel';
import { hasAcceptedCurrentConsent } from './localPreferencesModel';

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

export type StartDestination = 'consent' | 'permissions' | 'routeSelection' | 'camera';

export function getStartDestination(input: {
  platformOS: string;
  preferences?: KycLocalPreferences;
  permissions: {
    cameraGranted: boolean;
    microphoneGranted: boolean;
  };
}): StartDestination {
  if (!hasAcceptedCurrentConsent(input.preferences)) {
    return 'consent';
  }

  if (!input.permissions.cameraGranted || !input.permissions.microphoneGranted) {
    return 'permissions';
  }

  return shouldShowRouteSelection(input.platformOS) ? 'routeSelection' : 'camera';
}
