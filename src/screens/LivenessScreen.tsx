import { CheckCircle2, Eye, Rotate3D, Smile } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Pill, Title } from '../components/TextBlocks';
import { colors, radii, spacing } from '../theme';
import type { LivenessChallengeType, LivenessSignal } from '../types/kyc';

type LivenessScreenProps = {
  retryCount: number;
  onComplete: (signal: LivenessSignal) => void;
  onManualReviewDemo: (signal: LivenessSignal) => void;
};

const CHALLENGES: Array<{ type: LivenessChallengeType; title: string; description: string }> = [
  { type: 'blink', title: '请眨眼', description: '保持脸部在框内，完成一次自然眨眼。' },
  { type: 'turn_head', title: '请向左再向右转头', description: '缓慢转头，模拟活体动作挑战。' },
  { type: 'open_mouth', title: '请张嘴', description: '张嘴后保持 1 秒，再恢复自然表情。' },
];

export function LivenessScreen({ retryCount, onComplete, onManualReviewDemo }: LivenessScreenProps) {
  const challenge = useMemo(() => CHALLENGES[retryCount % CHALLENGES.length], [retryCount]);
  const [startedAt] = useState(() => new Date().toISOString());
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (completed) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [completed]);

  const completeChallenge = () => {
    setCompleted(true);
    onComplete({
      challengeType: challenge.type,
      challengeCompleted: true,
      challengeTimeout: false,
      challengeAttempts: retryCount > 0 ? 2 : 1,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  };

  const failChallenge = () => {
    setCompleted(true);
    onComplete({
      challengeType: challenge.type,
      challengeCompleted: false,
      challengeTimeout: true,
      challengeAttempts: retryCount > 0 ? 2 : 1,
      startedAt,
      completedAt: new Date().toISOString(),
      reason: '动作挑战未完成。',
    });
  };

  const completeWithReviewSignal = () => {
    setCompleted(true);
    onManualReviewDemo({
      challengeType: challenge.type,
      challengeCompleted: true,
      challengeTimeout: false,
      challengeAttempts: 2,
      startedAt,
      completedAt: new Date().toISOString(),
      reason: 'Demo preset: mixed signals for manual review.',
      demoPreset: 'manual_review',
    });
  };

  return (
    <Page
      footer={
        <>
          <PrimaryButton icon={CheckCircle2} label="我已完成动作" onPress={completeChallenge} />
          <PrimaryButton label="模拟复核信号" onPress={completeWithReviewSignal} variant="secondary" />
          <PrimaryButton label="模拟动作失败" onPress={failChallenge} variant="secondary" />
        </>
      }
    >
      <View style={styles.header}>
        <Eyebrow>Liveness</Eyebrow>
        <Title>完成动作挑战</Title>
        <BodyText>第一版使用 timed challenge 作为本地演示信号，后续可替换为 TrueDepth 或原生视觉识别。</BodyText>
        <Pill label="本地演示校验" />
      </View>

      <View style={styles.challengePanel}>
        <View style={styles.iconWrap}>{renderChallengeIcon(challenge.type)}</View>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.challengeBody}>{challenge.description}</Text>
        <View style={styles.countdown}>
          <Text style={styles.countdownNumber}>{secondsLeft}</Text>
          <Text style={styles.countdownLabel}>秒提示倒计时</Text>
        </View>
      </View>

      <Section title="检查项">
        <CheckRow icon={Eye} label="脸部保持在镜头前。" />
        <CheckRow icon={Rotate3D} label="按屏幕提示完成动作。" />
        <CheckRow icon={Smile} label="动作完成后点击确认。" />
      </Section>
    </Page>
  );
}

function renderChallengeIcon(type: LivenessChallengeType) {
  if (type === 'blink') {
    return <Eye color={colors.primary} size={48} strokeWidth={2.1} />;
  }
  if (type === 'turn_head') {
    return <Rotate3D color={colors.primary} size={48} strokeWidth={2.1} />;
  }
  return <Smile color={colors.primary} size={48} strokeWidth={2.1} />;
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  challengePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  challengeTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  challengeBody: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 260,
    textAlign: 'center',
  },
  countdown: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownNumber: {
    color: colors.primary,
    fontSize: 38,
    fontWeight: '900',
  },
  countdownLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
