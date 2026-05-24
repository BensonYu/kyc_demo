import { CheckCircle2, RotateCcw, ScanFace, Sun, UserRoundCheck } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Pill, Title } from '../components/TextBlocks';
import { colors, radii, spacing } from '../theme';
import type { CaptureArtifacts, QualitySignals } from '../types/kyc';

type CaptureReviewScreenProps = {
  capture: CaptureArtifacts;
  onApprove: (quality: QualitySignals) => void;
  onRetake: () => void;
};

const APPROVED_QUALITY: QualitySignals = {
  faceDetected: true,
  singleFace: true,
  faceCentered: true,
  brightnessOk: true,
  blurOk: true,
  occlusionOk: true,
};

export function CaptureReviewScreen({ capture, onApprove, onRetake }: CaptureReviewScreenProps) {
  return (
    <Page
      footer={
        <>
          <PrimaryButton icon={CheckCircle2} label="确认照片合格" onPress={() => onApprove(APPROVED_QUALITY)} />
          <PrimaryButton icon={RotateCcw} label="不合格，重新拍摄" onPress={onRetake} variant="secondary" />
        </>
      }
    >
      <View style={styles.header}>
        <Eyebrow>Capture Review</Eyebrow>
        <Title>确认人脸在框内且清晰</Title>
        <BodyText>当前版本不假装自动识别人脸位置。请根据照片确认质量，不合格必须重新拍摄。</BodyText>
        <Pill label="人工确认 Demo 信号" tone="warning" />
      </View>

      {capture.photoUri ? <Image source={{ uri: capture.photoUri }} style={styles.preview} resizeMode="cover" /> : null}

      <Section title="确认标准">
        <CheckRow icon={ScanFace} label="画面中只有一个人脸，并且脸部位于框内。" />
        <CheckRow icon={UserRoundCheck} label="没有口罩、墨镜、手部等明显遮挡。" />
        <CheckRow icon={Sun} label="光线足够，脸部不模糊。" />
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    marginBottom: spacing.xl,
  },
});

