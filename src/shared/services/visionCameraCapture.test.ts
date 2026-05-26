import { describe, expect, it } from 'vitest';

import {
  assertCompleteVisionCameraCapture,
  createVisionCameraCaptureArtifacts,
  getMeasuredDurationSeconds,
  toFileUri,
} from './visionCameraCapture';

describe('vision camera capture helpers', () => {
  it('converts plain native paths to file URIs', () => {
    expect(toFileUri('/tmp/selfie.jpg')).toBe('file:///tmp/selfie.jpg');
    expect(toFileUri('file:///tmp/selfie.jpg')).toBe('file:///tmp/selfie.jpg');
  });

  it('rounds measured duration to one decimal place', () => {
    expect(getMeasuredDurationSeconds(1000, 6410)).toBe(5.4);
  });

  it('creates complete capture artifacts from photo and video paths', () => {
    const capture = createVisionCameraCaptureArtifacts({
      photoPath: '/tmp/photo.jpg',
      videoPath: '/tmp/video.mp4',
      startedAt: 1000,
      finishedAt: 6400,
    });

    expect(capture.photoUri).toBe('file:///tmp/photo.jpg');
    expect(capture.videoUri).toBe('file:///tmp/video.mp4');
    expect(capture.videoDurationSeconds).toBe(5.4);
    expect(capture.cameraInterrupted).toBe(false);
  });

  it('keeps max-duration recordings at least 5 seconds even with timer drift', () => {
    const capture = createVisionCameraCaptureArtifacts({
      photoPath: '/tmp/photo.jpg',
      videoPath: '/tmp/video.mp4',
      startedAt: 1000,
      finishedAt: 5900,
    });

    expect(capture.videoDurationSeconds).toBe(5);
  });

  it('rejects missing photo or video artifacts', () => {
    expect(() =>
      assertCompleteVisionCameraCapture({
        videoUri: 'file:///tmp/video.mp4',
        videoDurationSeconds: 5,
        cameraInterrupted: false,
      }),
    ).toThrow('自拍照');

    expect(() =>
      assertCompleteVisionCameraCapture({
        photoUri: 'file:///tmp/photo.jpg',
        videoDurationSeconds: 5,
        cameraInterrupted: false,
      }),
    ).toThrow('自拍视频');
  });

  it('rejects short recordings', () => {
    expect(() =>
      assertCompleteVisionCameraCapture({
        photoUri: 'file:///tmp/photo.jpg',
        videoUri: 'file:///tmp/video.mp4',
        videoDurationSeconds: 4.9,
        cameraInterrupted: false,
      }),
    ).toThrow('不足 5 秒');
  });
});
