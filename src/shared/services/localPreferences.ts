import { Directory, File, Paths } from 'expo-file-system';

import type { PermissionSignals } from '../types/kyc';
import { KYC_CONSENT_VERSION, type KycLocalPreferences } from './localPreferencesModel';
export { KYC_CONSENT_VERSION, type KycLocalPreferences, hasAcceptedCurrentConsent } from './localPreferencesModel';

const DEFAULT_PERMISSIONS: PermissionSignals = {
  cameraGranted: false,
  microphoneGranted: false,
};

export async function loadKycLocalPreferences(): Promise<KycLocalPreferences | undefined> {
  try {
    const file = getPreferencesFile();
    if (!file.exists) {
      return undefined;
    }

    return normalizePreferences(JSON.parse(await file.text()));
  } catch {
    return undefined;
  }
}

export async function saveKycLocalPreferences(preferences: KycLocalPreferences): Promise<void> {
  const directory = getPreferencesDirectory();
  directory.create({ intermediates: true, idempotent: true });

  const file = getPreferencesFile();
  file.write(JSON.stringify(preferences, null, 2));
}

export async function markConsentAccepted(permissions: PermissionSignals = DEFAULT_PERMISSIONS): Promise<KycLocalPreferences> {
  const preferences: KycLocalPreferences = {
    consentAccepted: true,
    consentVersion: KYC_CONSENT_VERSION,
    lastPermissions: permissions,
    updatedAt: new Date().toISOString(),
  };

  await saveKycLocalPreferences(preferences);
  return preferences;
}

export async function updateStoredPermissions(
  permissions: PermissionSignals,
  current?: KycLocalPreferences,
): Promise<KycLocalPreferences> {
  const preferences: KycLocalPreferences = {
    consentAccepted: current?.consentAccepted ?? false,
    consentVersion: current?.consentVersion ?? KYC_CONSENT_VERSION,
    lastPermissions: permissions,
    updatedAt: new Date().toISOString(),
  };

  await saveKycLocalPreferences(preferences);
  return preferences;
}

function normalizePreferences(value: unknown): KycLocalPreferences | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<KycLocalPreferences>;
  const permissions = candidate.lastPermissions;

  return {
    consentAccepted: candidate.consentAccepted === true,
    consentVersion: typeof candidate.consentVersion === 'number' ? candidate.consentVersion : 0,
    lastPermissions: {
      cameraGranted: permissions?.cameraGranted === true,
      microphoneGranted: permissions?.microphoneGranted === true,
    },
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date(0).toISOString(),
  };
}

function getPreferencesDirectory(): Directory {
  return new Directory(Paths.document, 'kyc-demo');
}

function getPreferencesFile(): File {
  return new File(getPreferencesDirectory(), 'preferences.json');
}
