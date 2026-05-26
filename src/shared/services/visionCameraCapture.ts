import type { CaptureArtifacts } from '../types/kyc';

export const VISION_CAMERA_RECORDING_SECONDS = 5;

export type VisionCameraCaptureFiles = {
  photoPath?: string;
  videoPath?: string;
  startedAt: number;
  finishedAt: number;
  cameraInterrupted?: boolean;
};

export type CompleteCaptureArtifacts = CaptureArtifacts & {
  photoUri: string;
  videoUri: string;
};

export function toFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }

  return `file://${path}`;
}

export function getMeasuredDurationSeconds(startedAt: number, finishedAt: number): number {
  return Math.max(0, Math.round(((finishedAt - startedAt) / 1000) * 10) / 10);
}

export function createVisionCameraCaptureArtifacts(files: VisionCameraCaptureFiles): CaptureArtifacts {
  const measuredDuration = getMeasuredDurationSeconds(files.startedAt, files.finishedAt);
  const videoDurationSeconds = Math.max(VISION_CAMERA_RECORDING_SECONDS, measuredDuration);

  return {
    photoUri: files.photoPath ? toFileUri(files.photoPath) : undefined,
    videoUri: files.videoPath ? toFileUri(files.videoPath) : undefined,
    videoDurationSeconds,
    cameraInterrupted: files.cameraInterrupted === true,
  };
}

export function assertCompleteVisionCameraCapture(capture: CaptureArtifacts): asserts capture is CompleteCaptureArtifacts {
  if (!capture.photoUri) {
    throw new Error('自拍照采集失败，请重新采集。');
  }

  if (!capture.videoUri) {
    throw new Error('自拍视频录制失败，请重新采集。');
  }

  if (capture.videoDurationSeconds < VISION_CAMERA_RECORDING_SECONDS) {
    throw new Error('自拍视频不足 5 秒，请重新采集。');
  }
}
