import { CheckCircle2, Home, RefreshCw, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Pill, Title } from '../components/TextBlocks';
import { colors, radii, spacing } from '../theme';
import type { KycDecision, RiskScoreResult } from '../types/kyc';

type ResultScreenProps = {
  result: RiskScoreResult;
  onRetry: () => void;
  onDone: () => void;
};

const DECISION_COPY: Record<KycDecision, { title: string; eyebrow: string; tone: 'success' | 'warning' | 'danger'; icon: typeof CheckCircle2 }> = {
  pass: {
    eyebrow: 'Pass',
    title: '本地演示校验通过',
    tone: 'success',
    icon: CheckCircle2,
  },
  manual_review: {
    eyebrow: 'Review',
    title: '建议人工复核',
    tone: 'warning',
    icon: TriangleAlert,
  },
  retry: {
    eyebrow: 'Retry',
    title: '需要重新验证',
    tone: 'danger',
    icon: RefreshCw,
  },
};

export function ResultScreen({ result, onRetry, onDone }: ResultScreenProps) {
  const copy = DECISION_COPY[result.decision];
  const Icon = copy.icon;

  return (
    <Page
      footer={
        result.decision === 'pass' ? (
          <PrimaryButton icon={Home} label="完成" onPress={onDone} />
        ) : (
          <>
            <PrimaryButton icon={RefreshCw} label="重新验证" onPress={onRetry} />
            <PrimaryButton icon={Home} label="返回首页" onPress={onDone} variant="secondary" />
          </>
        )
      }
    >
      <View style={styles.header}>
        <View style={[styles.resultIcon, { backgroundColor: getToneBackground(copy.tone) }]}>
          <Icon color={getToneColor(copy.tone)} size={42} strokeWidth={2.2} />
        </View>
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Title>{copy.title}</Title>
        <BodyText>{result.primaryReason}</BodyText>
        <Pill label={`风险评分 ${result.score}/100`} tone={copy.tone} />
      </View>

      <View style={styles.scorePanel}>
        <Text style={styles.scoreNumber}>{result.score}</Text>
        <Text style={styles.scoreLabel}>Local mock risk score</Text>
      </View>

      <Section title="结果原因">
        {result.reasons.map((reason) => (
          <CheckRow key={reason.code} icon={reason.points && reason.points > 0 ? TriangleAlert : CheckCircle2} label={reason.message} tone={reason.points && reason.points > 0 ? copy.tone : 'success'} />
        ))}
      </Section>
    </Page>
  );
}

function getToneBackground(tone: 'success' | 'warning' | 'danger') {
  if (tone === 'success') {
    return colors.successSoft;
  }
  if (tone === 'warning') {
    return colors.warningSoft;
  }
  return colors.dangerSoft;
}

function getToneColor(tone: 'success' | 'warning' | 'danger') {
  if (tone === 'success') {
    return colors.success;
  }
  if (tone === 'warning') {
    return colors.warning;
  }
  return colors.danger;
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  resultIcon: {
    width: 86,
    height: 86,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePanel: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  scoreNumber: {
    color: colors.white,
    fontSize: 52,
    fontWeight: '900',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});

