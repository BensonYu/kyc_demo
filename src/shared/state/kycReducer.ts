import { createInitialSession } from './session';
import type {
  CaptureArtifacts,
  FaceQualityResult,
  KycSession,
  KycState,
  KycStep,
  KycVerificationRoute,
  LivenessSignal,
  PermissionSignals,
  QualitySignals,
  RiskScoreResult,
  TrueDepthSignals,
} from '../types/kyc';

export type KycAction =
  | { type: 'START' }
  | { type: 'BACK_TO_HOME' }
  | { type: 'ACCEPT_CONSENT' }
  | { type: 'SET_PERMISSIONS'; payload: PermissionSignals }
  | { type: 'SELECT_VERIFICATION_ROUTE'; payload: KycVerificationRoute }
  | { type: 'SET_BUSY'; payload: boolean }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'CAPTURE_COMPLETE'; payload: CaptureArtifacts }
  | { type: 'CAPTURE_ANALYSIS_COMPLETE'; payload: FaceQualityResult }
  | { type: 'CAPTURE_REVIEW_COMPLETE'; payload: QualitySignals }
  | { type: 'SET_QUALITY'; payload: QualitySignals }
  | { type: 'APPLY_MANUAL_REVIEW_DEMO_SIGNAL' }
  | { type: 'LIVENESS_COMPLETE'; payload: LivenessSignal }
  | { type: 'TRUE_DEPTH_COMPLETE'; payload: TrueDepthSignals }
  | { type: 'PROCESS' }
  | { type: 'SET_RESULT'; payload: RiskScoreResult }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'GO_TO_STEP'; payload: KycStep };

export function createInitialState(): KycState {
  return {
    step: 'idle',
    session: createInitialSession(),
    isBusy: false,
  };
}

export function kycReducer(state: KycState, action: KycAction): KycState {
  switch (action.type) {
    case 'START':
      return {
        step: 'consent',
        session: createInitialSession(),
        isBusy: false,
      };
    case 'BACK_TO_HOME':
    case 'RESET':
      return createInitialState();
    case 'ACCEPT_CONSENT':
      return setStep(state, 'permissions');
    case 'SET_PERMISSIONS':
      return {
        ...state,
        session: {
          ...state.session,
          permissions: action.payload,
        },
        step: action.payload.cameraGranted && action.payload.microphoneGranted ? 'routeSelection' : 'permissions',
        error: action.payload.cameraGranted && action.payload.microphoneGranted ? undefined : state.error,
      };
    case 'SELECT_VERIFICATION_ROUTE':
      return {
        ...state,
        session: mergeSession(state.session, {
          verificationRoute: action.payload,
        }),
        step: 'camera',
        isBusy: false,
        error: undefined,
      };
    case 'SET_BUSY':
      return {
        ...state,
        isBusy: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isBusy: false,
      };
    case 'CAPTURE_COMPLETE':
      return {
        ...state,
        session: mergeSession(state.session, {
          capture: action.payload,
          captureAnalysis: undefined,
        }),
        step: 'captureReview',
        isBusy: false,
        error: undefined,
      };
    case 'CAPTURE_ANALYSIS_COMPLETE':
      return {
        ...state,
        session: mergeSession(state.session, {
          captureAnalysis: action.payload,
        }),
        isBusy: false,
        error: undefined,
      };
    case 'CAPTURE_REVIEW_COMPLETE':
      return {
        ...state,
        session: mergeSession(state.session, {
          quality: action.payload,
        }),
        step: 'liveness',
        isBusy: false,
        error: undefined,
      };
    case 'SET_QUALITY':
      return {
        ...state,
        session: mergeSession(state.session, {
          quality: action.payload,
        }),
      };
    case 'APPLY_MANUAL_REVIEW_DEMO_SIGNAL':
      return {
        ...state,
        session: mergeSession(state.session, {
          quality: {
            ...state.session.quality,
            brightnessOk: false,
            blurOk: false,
          },
        }),
      };
    case 'LIVENESS_COMPLETE':
      return {
        ...state,
        session: mergeSession(state.session, {
          liveness: action.payload,
        }),
        step: 'processing',
        isBusy: false,
        error: undefined,
      };
    case 'TRUE_DEPTH_COMPLETE':
      return {
        ...state,
        session: mergeSession(state.session, {
          trueDepth: action.payload,
        }),
      };
    case 'PROCESS':
      return {
        ...state,
        step: 'processing',
        isBusy: true,
        error: undefined,
      };
    case 'SET_RESULT':
      return {
        ...state,
        session: mergeSession(state.session, {
          result: action.payload,
        }),
        step: 'result',
        isBusy: false,
        error: undefined,
      };
    case 'RETRY': {
      const next = createInitialSession();
      return {
        step: 'camera',
        isBusy: false,
        session: {
          ...next,
          retryCount: state.session.retryCount + 1,
          verificationRoute: state.session.verificationRoute,
          permissions: state.session.permissions,
        },
      };
    }
    case 'GO_TO_STEP':
      return setStep(state, action.payload);
    default:
      return state;
  }
}

function setStep(state: KycState, step: KycStep): KycState {
  return {
    ...state,
    step,
    isBusy: false,
    error: undefined,
  };
}

function mergeSession(session: KycSession, patch: Partial<KycSession>): KycSession {
  return {
    ...session,
    ...patch,
  };
}
