import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useReducer } from 'react';

import { HomeScreen } from './shared/screens/HomeScreen';
import { ConsentScreen } from './shared/screens/ConsentScreen';
import { PermissionsScreen } from './shared/screens/PermissionsScreen';
import { CameraCaptureScreen } from './shared/screens/CameraCaptureScreen';
import { CaptureReviewScreen } from './shared/screens/CaptureReviewScreen';
import { LivenessScreen } from './shared/screens/LivenessScreen';
import { ProcessingScreen } from './shared/screens/ProcessingScreen';
import { ResultScreen } from './shared/screens/ResultScreen';
import { createInitialState, kycReducer } from './shared/state/kycReducer';
import { scoreKycSession } from './shared/services/scoring';
import { getPlatformCapabilities } from './platform';
import type { CaptureArtifacts, LivenessSignal, PermissionSignals, QualitySignals } from './shared/types/kyc';

export function KycApp() {
  const [state, dispatch] = useReducer(kycReducer, undefined, createInitialState);
  const [, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [, requestMicrophonePermission, getMicrophonePermission] = useMicrophonePermissions();
  const processingSessionIdRef = useRef<string | undefined>(undefined);

  const syncPermissions = useCallback(async () => {
    dispatch({ type: 'SET_BUSY', payload: true });
    try {
      const [camera, microphone] = await Promise.all([getCameraPermission(), getMicrophonePermission()]);
      dispatch({
        type: 'SET_PERMISSIONS',
        payload: {
          cameraGranted: camera.granted,
          microphoneGranted: microphone.granted,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '读取权限状态失败。' });
    }
  }, [getCameraPermission, getMicrophonePermission]);

  const requestPermissions = useCallback(async () => {
    dispatch({ type: 'SET_BUSY', payload: true });
    try {
      const [camera, microphone] = await Promise.all([requestCameraPermission(), requestMicrophonePermission()]);
      const permissions: PermissionSignals = {
        cameraGranted: camera.granted,
        microphoneGranted: microphone.granted,
      };
      dispatch({
        type: 'SET_PERMISSIONS',
        payload: permissions,
      });

      if (!permissions.cameraGranted || !permissions.microphoneGranted) {
        dispatch({ type: 'SET_ERROR', payload: '请授权相机和麦克风后继续。' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '请求权限失败。' });
    }
  }, [requestCameraPermission, requestMicrophonePermission]);

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
      const capabilities = getPlatformCapabilities();
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
  }, [state.step, state.session.id]);

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
    return <HomeScreen onStart={() => dispatch({ type: 'START' })} />;
  }

  if (state.step === 'consent') {
    return <ConsentScreen onAccept={() => dispatch({ type: 'ACCEPT_CONSENT' })} onBack={() => dispatch({ type: 'BACK_TO_HOME' })} />;
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
            dispatch({ type: 'GO_TO_CAMERA' });
          } else {
            syncPermissions();
          }
        }}
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

  return <HomeScreen onStart={() => dispatch({ type: 'START' })} />;
}
