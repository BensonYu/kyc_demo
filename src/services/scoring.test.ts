import { describe, expect, it } from 'vitest';

import { createInitialSession } from '../state/session';
import { scoreKycSession } from './scoring';
import type { KycSession } from '../types/kyc';

describe('scoreKycSession', () => {
  it('returns pass for the happy path', () => {
    const result = scoreKycSession(makeCompleteSession());

    expect(result.decision).toBe('pass');
    expect(result.score).toBe(0);
  });

  it('returns retry when the selfie video is shorter than 5 seconds', () => {
    const session = makeCompleteSession({
      capture: {
        ...makeCompleteSession().capture,
        videoDurationSeconds: 3.8,
      },
    });

    const result = scoreKycSession(session);

    expect(result.decision).toBe('retry');
    expect(result.primaryReason).toContain('5 秒');
  });

  it('returns retry when liveness challenge is incomplete', () => {
    const session = makeCompleteSession({
      liveness: {
        challengeType: 'blink',
        challengeCompleted: false,
        challengeTimeout: true,
        challengeAttempts: 1,
        startedAt: new Date().toISOString(),
      },
    });

    const result = scoreKycSession(session);

    expect(result.decision).toBe('retry');
    expect(result.reasons[0]?.code).toBe('liveness_incomplete');
  });

  it('returns manual review for weak capture quality', () => {
    const session = makeCompleteSession({
      quality: {
        faceDetected: true,
        singleFace: true,
        faceCentered: true,
        brightnessOk: false,
        blurOk: false,
        occlusionOk: true,
      },
      liveness: {
        challengeType: 'blink',
        challengeCompleted: true,
        challengeTimeout: false,
        challengeAttempts: 2,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    });

    const result = scoreKycSession(session);

    expect(result.decision).toBe('manual_review');
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.score).toBeLessThanOrEqual(59);
  });

  it('does not penalize unsupported TrueDepth', () => {
    const baseline = scoreKycSession(makeCompleteSession());
    const unsupported = scoreKycSession(
      makeCompleteSession({
        trueDepth: {
          supported: false,
          available: false,
        },
      }),
    );

    expect(unsupported.score).toBe(baseline.score);
    expect(unsupported.decision).toBe(baseline.decision);
  });
});

function makeCompleteSession(patch: Partial<KycSession> = {}): KycSession {
  const session = createInitialSession();

  return {
    ...session,
    capture: {
      photoUri: 'file:///photo.jpg',
      videoUri: 'file:///video.mov',
      videoDurationSeconds: 5,
      cameraInterrupted: false,
    },
    liveness: {
      challengeType: 'blink',
      challengeCompleted: true,
      challengeTimeout: false,
      challengeAttempts: 1,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    ...patch,
  };
}
