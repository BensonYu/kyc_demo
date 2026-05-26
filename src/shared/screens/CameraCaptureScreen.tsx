import { Camera, RefreshCw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera as VisionCamera,
  CommonResolutions,
  useCameraDevice,
  usePhotoOutput,
  useVideoOutput,
  type CameraOutput,
  type Recorder,
  type RecordingFinishedReason,
} from 'react-native-vision-camera';

import { PrimaryButton } from '../components/PrimaryButton';
import { copyArtifactToSession } from '../services/artifacts';
import {
  assertCompleteVisionCameraCapture,
  createVisionCameraCaptureArtifacts,
  VISION_CAMERA_RECORDING_SECONDS,
} from '../services/visionCameraCapture';
import { colors, radii, spacing } from '../theme';
import type { CaptureArtifacts } from '../types/kyc';

type CameraCaptureScreenProps = {
  sessionId: string;
  onCaptureComplete: (capture: CaptureArtifacts) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

type CapturePhase = 'ready' | 'photo' | 'video' | 'saving' | 'error';
type RecordingSession = {
  started: Promise<void>;
  finished: Promise<string>;
};
type RecordingResolver = {
  resolve: (filePath: string) => void;
  reject: (error: Error) => void;
};

export function CameraCaptureScreen({ sessionId, onCaptureComplete, onError, onCancel }: CameraCaptureScreenProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedAtRef = useRef<number | undefined>(undefined);
  const recorderRef = useRef<Recorder | undefined>(undefined);
  const captureRunIdRef = useRef(0);
  const cameraInterruptedRef = useRef(false);
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.FHD_4_3,
    containerFormat: 'jpeg',
    quality: 0.82,
    qualityPrioritization: 'balanced',
  });
  const videoOutput = useVideoOutput({
    targetResolution: CommonResolutions.FHD_16_9,
    enableAudio: true,
    fileType: 'mp4',
  });
  const cameraOutputs = useMemo<CameraOutput[]>(() => [photoOutput, videoOutput], [photoOutput, videoOutput]);
  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [isConfigured, setIsConfigured] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string>();

  const isBusy = phase === 'photo' || phase === 'video' || phase === 'saving';
  const isPreparingCamera = !device || !isConfigured;
  const canCapture = Boolean(device && isConfigured && !isBusy);

  const progressLabel = useMemo(() => {
    if (phase === 'ready') {
      if (!device) {
        return '正在查找前置摄像头；如长时间停留，请检查设备';
      }

      return isConfigured ? '将脸部放入框内，点击后会采集自拍照和 5 秒自拍视频' : '正在准备前置摄像头';
    }

    if (phase === 'photo') {
      return '正在采集照片和 5 秒自拍视频';
    }

    if (phase === 'video') {
      return `正在采集照片和 5 秒自拍视频 ${Math.min(VISION_CAMERA_RECORDING_SECONDS, Math.ceil(progress))}/${VISION_CAMERA_RECORDING_SECONDS}s`;
    }

    if (phase === 'saving') {
      return '正在保存本地会话文件';
    }

    return localError ?? '拍摄失败，请重试';
  }, [device, isConfigured, localError, phase, progress]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      recorderRef.current?.cancelRecording().catch(() => undefined);
    };
  }, []);

  const startCapture = async () => {
    if (!canCapture) {
      return;
    }

    const captureRunId = captureRunIdRef.current + 1;
    captureRunIdRef.current = captureRunId;
    recorderRef.current = undefined;
    startedAtRef.current = undefined;
    setLocalError(undefined);
    setProgress(0);
    setPhase('photo');
    let recording: RecordingSession | undefined;

    try {
      const recorder = await videoOutput.createRecorder({
        maxDuration: VISION_CAMERA_RECORDING_SECONDS,
      });
      recorderRef.current = recorder;

      recording = startRecording(recorder);
      recording.finished.catch(() => undefined);
      await recording.started;
      startedAtRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (!startedAtRef.current) {
          return;
        }

        setProgress((Date.now() - startedAtRef.current) / 1000);
      }, 160);

      await waitForRecordingWarmup();
      setPhase('video');

      const photo = await photoOutput.capturePhotoToFile(
        {
          flashMode: 'off',
          enableShutterSound: false,
        },
        {},
      );

      const videoPath = await recording.finished;
      const finishedAt = Date.now();
      recorderRef.current = undefined;
      clearProgressTimer(intervalRef);
      setProgress(VISION_CAMERA_RECORDING_SECONDS);
      setPhase('saving');

      const capture = createVisionCameraCaptureArtifacts({
        photoPath: photo.filePath,
        videoPath,
        startedAt: startedAtRef.current ?? finishedAt - VISION_CAMERA_RECORDING_SECONDS * 1000,
        finishedAt,
        cameraInterrupted: cameraInterruptedRef.current,
      });
      assertCompleteVisionCameraCapture(capture);

      const [photoUri, videoUri] = await Promise.all([
        copyArtifactToSession(capture.photoUri, sessionId, 'selfie-photo.jpg'),
        copyArtifactToSession(capture.videoUri, sessionId, 'selfie-video.mp4'),
      ]);

      onCaptureComplete({
        photoUri,
        videoUri,
        videoDurationSeconds: capture.videoDurationSeconds,
        cameraInterrupted: capture.cameraInterrupted,
      });
    } catch (error) {
      if (captureRunIdRef.current === captureRunId) {
        recorderRef.current?.cancelRecording().catch(() => undefined);
        recorderRef.current = undefined;
      }
      clearProgressTimer(intervalRef);
      const message = normalizeCaptureError(error);
      setPhase('error');
      setLocalError(message);
      onError(message);
    }
  };

  return (
    <View style={styles.container}>
      {device ? (
        <VisionCamera
          style={styles.camera}
          device={device}
          outputs={cameraOutputs}
          constraints={[{ resolutionBias: videoOutput }, { resolutionBias: photoOutput }]}
          isActive
          resizeMode="cover"
          mirrorMode="auto"
          onConfigured={() => {
            setIsConfigured(true);
            cameraInterruptedRef.current = false;
          }}
          onError={(error) => {
            recorderRef.current?.cancelRecording().catch(() => undefined);
            const message = normalizeCaptureError(error);
            setPhase('error');
            setLocalError(message);
            onError(message);
          }}
          onInterruptionStarted={() => {
            cameraInterruptedRef.current = true;
            recorderRef.current?.cancelRecording().catch(() => undefined);
          }}
        />
      ) : null}
      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>自拍采集</Text>
          <Text style={styles.topMeta}>自拍照 + 5 秒自拍视频</Text>
        </View>

        <View pointerEvents="none" style={styles.guideWrap}>
          <View style={styles.faceGuide}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <Text style={styles.guideText}>{progressLabel}</Text>
          {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
          {phase === 'photo' || phase === 'video' ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (progress / VISION_CAMERA_RECORDING_SECONDS) * 100)}%` }]} />
            </View>
          ) : null}
          {isBusy || isPreparingCamera ? <ActivityIndicator color={colors.white} /> : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            icon={phase === 'error' ? RefreshCw : Camera}
            label={phase === 'error' ? '重新采集' : '开始采集'}
            onPress={startCapture}
            disabled={!canCapture}
          />
          <PrimaryButton label="返回首页" onPress={onCancel} variant="secondary" disabled={isBusy} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function startRecording(recorder: Recorder): RecordingSession {
  const resolver = createRecordingResolver();
  const finished = new Promise<string>((resolve, reject) => {
    resolver.resolve = resolve;
    resolver.reject = reject;
  });
  const started = recorder.startRecording(
    (filePath: string, reason: RecordingFinishedReason) => {
      if (reason !== 'max-duration-reached' && reason !== 'stopped') {
        resolver.reject(new Error(`自拍视频录制被中断：${reason}`));
        return;
      }

      resolver.resolve(filePath);
    },
    resolver.reject,
  ).catch((error) => {
    resolver.reject(error);
    throw error;
  });

  return { started, finished };
}

function createRecordingResolver(): RecordingResolver {
  return {
    resolve: () => undefined,
    reject: () => undefined,
  };
}

function waitForRecordingWarmup(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 250));
}

function clearProgressTimer(intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | undefined>) {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
  }
}

function normalizeCaptureError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const message = rawMessage.toLowerCase();

  if (message.includes('capture image') || message.includes('picture')) {
    return '自拍照采集失败，请保持手机稳定并重试。';
  }

  if (message.includes('record') || message.includes('video') || message.includes('recorder')) {
    return '自拍视频录制失败，请检查麦克风/相机权限后重试。';
  }

  if (message.includes('permission')) {
    return '相机或麦克风权限不可用，请授权后重试。';
  }

  if (message.includes('camera') || message.includes('device')) {
    return '前置摄像头暂不可用，请重新打开页面后重试。';
  }

  return rawMessage || '拍摄或录制过程中发生错误。';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  camera: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'space-between',
    backgroundColor: colors.cameraOverlay,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  topTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
  },
  topMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  guideWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  faceGuide: {
    width: 250,
    height: 330,
    maxWidth: '78%',
    borderRadius: 128,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  corner: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderColor: colors.white,
  },
  cornerTopLeft: {
    top: -1,
    left: 22,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radii.md,
  },
  cornerTopRight: {
    top: -1,
    right: 22,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radii.md,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: 22,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radii.md,
  },
  cornerBottomRight: {
    right: 22,
    bottom: -1,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: radii.md,
  },
  guideText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    maxWidth: '82%',
    color: colors.white,
    backgroundColor: 'rgba(180, 35, 24, 0.86)',
    borderRadius: radii.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressTrack: {
    width: '78%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
});
