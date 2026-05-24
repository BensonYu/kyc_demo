import type { KycDecision, KycSession, RiskReason, RiskScoreResult } from '../types/kyc';

export function scoreKycSession(session: KycSession): RiskScoreResult {
  const blocking = getBlockingReason(session);
  if (blocking) {
    return {
      decision: 'retry',
      score: 100,
      primaryReason: blocking.message,
      reasons: [blocking],
    };
  }

  const reasons: RiskReason[] = [];
  let score = 0;

  const add = (condition: boolean, points: number, code: string, message: string) => {
    if (!condition) {
      return;
    }
    score += points;
    reasons.push({ code, message, points });
  };

  add(!session.quality.faceCentered, 10, 'face_not_centered', '人脸未完全居中。');
  add(!session.quality.brightnessOk, 15, 'brightness_weak', '光线条件偏弱。');
  add(!session.quality.blurOk, 20, 'blur_weak', '画面清晰度不足。');
  add(!session.quality.occlusionOk, 20, 'occlusion_detected', '脸部存在遮挡。');
  add((session.liveness?.challengeAttempts ?? 1) > 1, 10, 'liveness_retry', '活体动作经过多次尝试。');
  add(session.retryCount === 1, 10, 'retry_once', '当前会话曾经重试。');
  add(session.retryCount >= 2, 20, 'retry_multiple', '当前会话多次重试。');

  if (session.trueDepth.supported && session.trueDepth.available) {
    add(session.trueDepth.faceDepthConsistent === false, 25, 'depth_inconsistent', 'TrueDepth 深度信号不一致。');
    add(session.trueDepth.challengeMotionMatched === false, 25, 'depth_motion_mismatch', 'TrueDepth 动作信号未匹配。');
    add(
      session.trueDepth.presentationAttackSuspected === true,
      50,
      'presentation_attack_suspected',
      'TrueDepth 信号提示存在展示攻击风险。',
    );
  }

  const subtract = (condition: boolean, points: number) => {
    if (condition) {
      score -= points;
    }
  };

  subtract(session.quality.faceCentered, 5);
  subtract(session.quality.brightnessOk, 5);
  subtract(session.quality.blurOk, 5);
  subtract(session.quality.occlusionOk, 5);

  if (session.trueDepth.supported && session.trueDepth.available) {
    subtract(session.trueDepth.faceDepthConsistent === true, 15);
    subtract(session.trueDepth.challengeMotionMatched === true, 15);
  }

  const clampedScore = clamp(score, 0, 100);
  const decision = getDecision(clampedScore);

  return {
    decision,
    score: clampedScore,
    primaryReason: getPrimaryReason(decision, reasons),
    reasons: reasons.length > 0 ? reasons : [{ code: 'all_checks_ok', message: '照片、视频和活体动作均满足本地演示校验。' }],
  };
}

function getBlockingReason(session: KycSession): RiskReason | undefined {
  const rules: Array<[boolean, RiskReason]> = [
    [!session.capture.photoUri, { code: 'missing_photo', message: '未采集自拍照，请重新拍摄。' }],
    [!session.capture.videoUri, { code: 'missing_video', message: '未采集自拍视频，请重新录制。' }],
    [
      session.capture.videoDurationSeconds < 5,
      { code: 'short_video', message: '自拍视频不足 5 秒，请重新录制。' },
    ],
    [session.capture.cameraInterrupted, { code: 'camera_interrupted', message: '摄像头被中断，请重新开始。' }],
    [!session.quality.faceDetected, { code: 'no_face', message: '未检测到人脸，请重新拍摄。' }],
    [!session.quality.singleFace, { code: 'multiple_faces', message: '检测到多张人脸，请确保画面中只有本人。' }],
    [
      !session.liveness?.challengeCompleted,
      { code: 'liveness_incomplete', message: '活体动作未完成，请重试。' },
    ],
    [Boolean(session.liveness?.challengeTimeout), { code: 'liveness_timeout', message: '活体动作超时，请重试。' }],
  ];

  return rules.find(([condition]) => condition)?.[1];
}

function getDecision(score: number): KycDecision {
  if (score <= 29) {
    return 'pass';
  }

  if (score <= 59) {
    return 'manual_review';
  }

  return 'retry';
}

function getPrimaryReason(decision: KycDecision, reasons: RiskReason[]): string {
  if (decision === 'pass') {
    return '本地演示校验通过。';
  }

  if (decision === 'manual_review') {
    return reasons[0]?.message ?? '本地信号存在不确定性，建议人工复核。';
  }

  return reasons[0]?.message ?? '风险评分偏高，请重新验证。';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
