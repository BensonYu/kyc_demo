import { CameraView } from 'expo-camera';
import type { CameraMode } from 'expo-camera';
import { Camera, RefreshCw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { copyArtifactToSession } from '../services/artifacts';
import { colors, radii, spacing } from '../theme';
import type { CaptureArtifacts } from '../types/kyc';

type CameraCaptureScreenProps = {
  sessionId: string;
  onCaptureComplete: (capture: CaptureArtifacts) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

type CapturePhase = 'ready' | 'photo' | 'video' | 'saving' | 'error';

const RECORDING_SECONDS = 5;

export function CameraCaptureScreen({ sessionId, onCaptureComplete, onError, onCancel }: CameraCaptureScreenProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedAtRef = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [cameraMode, setCameraMode] = useState<CameraMode>('picture');
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string>();

  const isBusy = phase === 'photo' || phase === 'video' || phase === 'saving';

  const progressLabel = useMemo(() => {
    if (phase === 'ready') {
      return '将脸部放入框内，点击后会采集自拍照和 5 秒自拍视频';
    }

    if (phase === 'photo') {
      return '正在采集照片和 5 秒自拍视频';
    }

    if (phase === 'video') {
      return `正在采集照片和 5 秒自拍视频 ${Math.min(RECORDING_SECONDS, Math.ceil(progress))}/${RECORDING_SECONDS}s`;
    }

    if (phase === 'saving') {
      return '正在保存本地会话文件';
    }

    return localError ?? '拍摄失败，请重试';
  }, [localError, phase, progress]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      try {
        cameraRef.current?.stopRecording();
      } catch {
        // The native camera may already be stopped when the screen unmounts.
      }
    };
  }, []);

  const startCapture = async () => {
    if (!cameraRef.current || isBusy) {
      return;
    }

    setLocalError(undefined);
    setProgress(0);
    setCameraMode('picture');
    setPhase('photo');

    try {
      await waitForCameraModeSwitch();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.82,
        skipProcessing: false,
      });

      setCameraMode('video');
      setPhase('video');
      await waitForCameraModeSwitch();

      startedAtRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (!startedAtRef.current) {
          return;
        }

        setProgress((Date.now() - startedAtRef.current) / 1000);
      }, 160);

      const video = await cameraRef.current.recordAsync({
        maxDuration: RECORDING_SECONDS,
      });

      if (!video?.uri) {
        throw new Error('自拍视频未成功保存，请重新录制。');
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }

      const measuredDuration = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : RECORDING_SECONDS;
      setProgress(RECORDING_SECONDS);
      setPhase('saving');

      const [photoUri, videoUri] = await Promise.all([
        copyArtifactToSession(photo.uri, sessionId, 'selfie-photo.jpg'),
        copyArtifactToSession(video.uri, sessionId, 'selfie-video.mov'),
      ]);

      onCaptureComplete({
        photoUri,
        videoUri,
        videoDurationSeconds: Math.max(RECORDING_SECONDS, Math.round(measuredDuration * 10) / 10),
        cameraInterrupted: false,
      });
    } catch (error) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      const message = normalizeCaptureError(error);
      setPhase('error');
      setLocalError(message);
      onError(message);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" mode={cameraMode} active />
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
              <View style={[styles.progressFill, { width: `${Math.min(100, (progress / RECORDING_SECONDS) * 100)}%` }]} />
            </View>
          ) : null}
          {isBusy ? <ActivityIndicator color={colors.white} /> : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            icon={phase === 'error' ? RefreshCw : Camera}
            label={phase === 'error' ? '重新采集' : '开始采集'}
            onPress={startCapture}
            disabled={isBusy}
          />
          <PrimaryButton label="返回首页" onPress={onCancel} variant="secondary" disabled={isBusy} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function waitForCameraModeSwitch(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}

function normalizeCaptureError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const message = rawMessage.toLowerCase();

  if (message.includes('capture image') || message.includes('picture')) {
    return '自拍照采集失败，请保持手机稳定并重试。';
  }

  if (message.includes('record') || message.includes('video')) {
    return '自拍视频录制失败，请检查麦克风/相机权限后重试。';
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
