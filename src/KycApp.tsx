import { useCallback, useEffect, useRef, useReducer } from 'react';
import { Platform } from 'react-native';
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

import { HomeScreen } from './shared/screens/HomeScreen';
import { ConsentScreen } from './shared/screens/ConsentScreen';
import { PermissionsScreen } from './shared/screens/PermissionsScreen';
import { RouteSelectionScreen } from './shared/screens/RouteSelectionScreen';
import { CameraCaptureScreen } from './shared/screens/CameraCaptureScreen';
import { CaptureReviewScreen } from './shared/screens/CaptureReviewScreen';
import { LivenessScreen } from './shared/screens/LivenessScreen';
import { ProcessingScreen } from './shared/screens/ProcessingScreen';
import { ResultScreen } from './shared/screens/ResultScreen';
import { createInitialState, kycReducer } from './shared/state/kycReducer';
import { scoreKycSession } from './shared/services/scoring';
import { getQualitySignals, isCaptureAnalysisPassing, SELFIE_GUIDE_BOX } from './shared/services/faceQuality';
import {
  getDefaultVerificationRoute,
  getStartDestination,
  shouldShowRouteSelection,
} from './shared/services/routes';
import {
  type KycLocalPreferences,
  loadKycLocalPreferences,
  markConsentAccepted,
  updateStoredPermissions,
} from './shared/services/localPreferences';
import { getPlatformCapabilities } from './platform';
import type { CaptureArtifacts, LivenessSignal, PermissionSignals, QualitySignals } from './shared/types/kyc';

export function KycApp() {
  const [state, dispatch] = useReducer(kycReducer, undefined, createInitialState);
  const cameraPermission = useCameraPermission();
  const microphonePermission = useMicrophonePermission();
  const processingSessionIdRef = useRef<string | undefined>(undefined);
  const captureAnalysisUriRef = useRef<string | undefined>(undefined);
  const preferencesRef = useRef<KycLocalPreferences | undefined>(undefined);

  const selectDefaultRoute = useCallback(() => {
    dispatch({ type: 'SELECT_VERIFICATION_ROUTE', payload: getDefaultVerificationRoute(Platform.OS) });
  }, []);

  useEffect(() => {
    if (state.step === 'routeSelection' && !shouldShowRouteSelection(Platform.OS)) {
      selectDefaultRoute();
    }
  }, [selectDefaultRoute, state.step]);

  const readSystemPermissions = useCallback(async (): Promise<PermissionSignals> => {
    return {
      cameraGranted: cameraPermission.hasPermission,
      microphoneGranted: microphonePermission.hasPermission,
    };
  }, [cameraPermission.hasPermission, microphonePermission.hasPermission]);

  const persistPermissions = useCallback(async (permissions: PermissionSignals) => {
    preferencesRef.current = await updateStoredPermissions(permissions, preferencesRef.current);
  }, []);

  const syncPermissionsAndContinue = useCallback(async () => {
    dispatch({ type: 'SET_BUSY', payload: true });
    try {
      const permissions = await readSystemPermissions();
      dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
      await persistPermissions(permissions);

      if (!permissions.cameraGranted || !permissions.microphoneGranted) {
        dispatch({ type: 'SET_ERROR', payload: '请授权相机和麦克风后继续。' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '读取权限状态失败。' });
    }
  }, [persistPermissions, readSystemPermissions]);

  useEffect(() => {
    let canceled = false;

    const hydrate = async () => {
      const [preferences, permissions] = await Promise.all([loadKycLocalPreferences(), readSystemPermissions()]);

      if (canceled) {
        return;
      }

      preferencesRef.current = preferences;
      dispatch({ type: 'SYNC_PERMISSIONS', payload: permissions });

      if (preferences) {
        persistPermissions(permissions).catch(() => undefined);
      }
    };

    hydrate().catch(() => undefined);

    return () => {
      canceled = true;
    };
  }, [persistPermissions, readSystemPermissions]);

  const requestPermissions = useCallback(async () => {
    dispatch({ type: 'SET_BUSY', payload: true });
    try {
      const [cameraGranted, microphoneGranted] = await Promise.all([
        cameraPermission.hasPermission ? true : cameraPermission.requestPermission(),
        microphonePermission.hasPermission ? true : microphonePermission.requestPermission(),
      ]);
      const permissions: PermissionSignals = {
        cameraGranted,
        microphoneGranted,
      };
      dispatch({
        type: 'SET_PERMISSIONS',
        payload: permissions,
      });

      await persistPermissions(permissions);

      if (!permissions.cameraGranted || !permissions.microphoneGranted) {
        dispatch({ type: 'SET_ERROR', payload: '请授权相机和麦克风后继续。' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '请求权限失败。' });
    }
  }, [cameraPermission, microphonePermission, persistPermissions]);

  const handleStart = useCallback(async () => {
    dispatch({ type: 'SET_BUSY', payload: true });

    try {
      const [preferences, permissions] = await Promise.all([loadKycLocalPreferences(), readSystemPermissions()]);
      preferencesRef.current = preferences;

      const destination = getStartDestination({
        platformOS: Platform.OS,
        preferences,
        permissions,
      });

      dispatch({
        type: 'START_WITH_LOCAL_STATE',
        payload: {
          step: destination,
          permissions,
          verificationRoute: getDefaultVerificationRoute(Platform.OS),
        },
      });

      if (preferences) {
        persistPermissions(permissions).catch(() => undefined);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '读取本地状态失败。' });
    }
  }, [persistPermissions, readSystemPermissions]);

  const handleAcceptConsent = useCallback(async () => {
    dispatch({ type: 'SET_BUSY', payload: true });

    try {
      const permissions = await readSystemPermissions();
      const preferences = await markConsentAccepted(permissions);
      preferencesRef.current = preferences;

      const destination = getStartDestination({
        platformOS: Platform.OS,
        preferences,
        permissions,
      });

      dispatch({
        type: 'START_WITH_LOCAL_STATE',
        payload: {
          step: destination,
          permissions,
          verificationRoute: getDefaultVerificationRoute(Platform.OS),
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '保存隐私确认失败。' });
    }
  }, [readSystemPermissions]);

  useEffect(() => {
    if (state.step !== 'processing') {
      processingSessionIdRef.current = undefined;
      return;
    }

    if (processingSessionIdRef.current === state.session.id) {
      return;
    }

    processingSessionIdRef.current = state.session.id;
    const sessionToScore = state.session;
    let canceled = false;

    const process = async () => {
      dispatch({ type: 'SET_BUSY', payload: true });
      const capabilities = getPlatformCapabilities(state.session.verificationRoute);
      const trueDepth = await capabilities.trueDepth.getSignals();

      if (canceled) {
        return;
      }

      dispatch({ type: 'TRUE_DEPTH_COMPLETE', payload: trueDepth });

      const sessionWithTrueDepth = {
        ...sessionToScore,
        trueDepth,
      };

      const result = scoreKycSession(sessionWithTrueDepth);

      setTimeout(() => {
        if (!canceled) {
          dispatch({ type: 'SET_RESULT', payload: result });
        }
      }, 650);
    };

    process();

    return () => {
      canceled = true;
    };
  }, [state.step, state.session.id, state.session.verificationRoute]);

  useEffect(() => {
    if (state.step !== 'captureReview') {
      captureAnalysisUriRef.current = undefined;
      return;
    }

    const capture = state.session.capture;
    if (!capture.photoUri || captureAnalysisUriRef.current === capture.photoUri) {
      return;
    }

    captureAnalysisUriRef.current = capture.photoUri;
    let canceled = false;

    const analyzeCapture = async () => {
      dispatch({ type: 'SET_BUSY', payload: true });
      const capabilities = getPlatformCapabilities(state.session.verificationRoute);
      const result = await capabilities.face.analyzeCapture({
        capture,
        guideBox: SELFIE_GUIDE_BOX,
      });

      if (canceled) {
        return;
      }

      dispatch({ type: 'CAPTURE_ANALYSIS_COMPLETE', payload: result });

      if (isCaptureAnalysisPassing(result)) {
        dispatch({ type: 'CAPTURE_REVIEW_COMPLETE', payload: getQualitySignals(result) });
      }
    };

    analyzeCapture().catch((error) => {
      if (!canceled) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '照片质量分析失败，请重新拍摄。' });
      }
    });

    return () => {
      canceled = true;
    };
  }, [state.step, state.session.capture.photoUri, state.session.verificationRoute]);

  const handleCaptureComplete = (capture: CaptureArtifacts) => {
    dispatch({ type: 'CAPTURE_COMPLETE', payload: capture });
  };

  const handleCaptureReviewComplete = (quality: QualitySignals) => {
    dispatch({ type: 'CAPTURE_REVIEW_COMPLETE', payload: quality });
  };

  const handleLivenessComplete = (signal: LivenessSignal) => {
    dispatch({ type: 'LIVENESS_COMPLETE', payload: signal });
  };

  const handleManualReviewDemo = (signal: LivenessSignal) => {
    dispatch({ type: 'APPLY_MANUAL_REVIEW_DEMO_SIGNAL' });
    dispatch({ type: 'LIVENESS_COMPLETE', payload: signal });
  };

  if (state.step === 'idle') {
    return <HomeScreen onStart={handleStart} />;
  }

  if (state.step === 'consent') {
    return <ConsentScreen onAccept={handleAcceptConsent} onBack={() => dispatch({ type: 'BACK_TO_HOME' })} />;
  }

  if (state.step === 'permissions') {
    return (
      <PermissionsScreen
        permissions={state.session.permissions}
        isBusy={state.isBusy}
        error={state.error}
        onRequest={requestPermissions}
        onContinue={() => {
          if (state.session.permissions.cameraGranted && state.session.permissions.microphoneGranted) {
            if (shouldShowRouteSelection(Platform.OS)) {
              dispatch({ type: 'GO_TO_STEP', payload: 'routeSelection' });
            } else {
              selectDefaultRoute();
            }
          } else {
            syncPermissionsAndContinue();
          }
        }}
      />
    );
  }

  if (state.step === 'routeSelection') {
    if (!shouldShowRouteSelection(Platform.OS)) {
      return <ProcessingScreen />;
    }

    return (
      <RouteSelectionScreen
        selectedRoute={state.session.verificationRoute}
        onSelectRoute={(route) => dispatch({ type: 'SELECT_VERIFICATION_ROUTE', payload: route })}
        onBack={() => dispatch({ type: 'GO_TO_STEP', payload: 'permissions' })}
      />
    );
  }

  if (state.step === 'camera') {
    return (
      <CameraCaptureScreen
        sessionId={state.session.id}
        onCaptureComplete={handleCaptureComplete}
        onError={(message) => dispatch({ type: 'SET_ERROR', payload: message })}
        onCancel={() => dispatch({ type: 'BACK_TO_HOME' })}
      />
    );
  }

  if (state.step === 'captureReview') {
    return (
      <CaptureReviewScreen
        capture={state.session.capture}
        analysis={state.session.captureAnalysis}
        isAnalyzing={state.isBusy && !state.session.captureAnalysis}
        onApprove={handleCaptureReviewComplete}
        onRetake={() => dispatch({ type: 'RETRY' })}
      />
    );
  }

  if (state.step === 'liveness') {
    return (
      <LivenessScreen
        retryCount={state.session.retryCount}
        onComplete={handleLivenessComplete}
        onManualReviewDemo={handleManualReviewDemo}
      />
    );
  }

  if (state.step === 'processing') {
    return <ProcessingScreen />;
  }

  if (state.step === 'result' && state.session.result) {
    return <ResultScreen result={state.session.result} onRetry={() => dispatch({ type: 'RETRY' })} onDone={() => dispatch({ type: 'RESET' })} />;
  }

  return <HomeScreen onStart={handleStart} />;
}
