import type { PermissionSignals } from '../types/kyc';

export const KYC_CONSENT_VERSION = 1;

export type KycLocalPreferences = {
  consentAccepted: boolean;
  consentVersion: number;
  lastPermissions: PermissionSignals;
  updatedAt: string;
};

export function hasAcceptedCurrentConsent(preferences?: KycLocalPreferences): boolean {
  return Boolean(preferences?.consentAccepted && preferences.consentVersion === KYC_CONSENT_VERSION);
}
