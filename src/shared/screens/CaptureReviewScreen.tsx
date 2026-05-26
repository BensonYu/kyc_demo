import { AlertCircle, Bot, CheckCircle2, RotateCcw, ScanFace, Sun, UserRoundCheck } from 'lucide-react-native';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Pill, Title } from '../components/TextBlocks';
import { getQualitySignals, isCaptureAnalysisPassing } from '../services/faceQuality';
import { colors, radii, spacing } from '../theme';
import type { CaptureArtifacts, FaceQualityResult, QualitySignals } from '../types/kyc';

type CaptureReviewScreenProps = {
  capture: CaptureArtifacts;
  analysis?: FaceQualityResult;
  isAnalyzing?: boolean;
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

export function CaptureReviewScreen({ capture, analysis, isAnalyzing, onApprove, onRetake }: CaptureReviewScreenProps) {
  const nativeAnalysisReady = Boolean(analysis && analysis.provider !== 'manual_review');
  const nativeAnalysisPassed = isCaptureAnalysisPassing(analysis);
  const isNativeBlockingFailure = Boolean(nativeAnalysisReady && !nativeAnalysisPassed);
  const reviewTitle = isAnalyzing
    ? '正在自动检查自拍照'
    : nativeAnalysisPassed
      ? '人脸位置已通过自动检查'
      : isNativeBlockingFailure
        ? '自拍照需要重拍'
        : '确认人脸在框内且清晰';
  const reviewBody = isAnalyzing
    ? 'Android 设备会优先使用本地 ML Kit 检查单人脸和取景框位置；不可用时会切换为人工确认 Demo。'
    : nativeAnalysisPassed
      ? '本地 Android ML Kit 已检测到单个人脸，并确认人脸在框内。请继续动作活体。'
      : isNativeBlockingFailure
        ? '当前照片未通过本地人脸位置检查，不能进入活体流程。请按提示重新拍摄。'
        : '当前环境没有可用的原生自动分析，请根据照片确认质量，不合格必须重新拍摄。';
  const footer = isAnalyzing ? (
    <>
      <PrimaryButton icon={ScanFace} label="正在检查照片" onPress={() => undefined} loading disabled />
      <PrimaryButton icon={RotateCcw} label="重新拍摄" onPress={onRetake} variant="secondary" disabled />
    </>
  ) : isNativeBlockingFailure ? (
    <PrimaryButton icon={RotateCcw} label="重新拍摄" onPress={onRetake} variant="danger" />
  ) : (
    <>
      <PrimaryButton
        icon={CheckCircle2}
        label={nativeAnalysisPassed ? '继续动作活体' : '确认照片合格'}
        onPress={() => onApprove(nativeAnalysisPassed && analysis ? getQualitySignals(analysis) : APPROVED_QUALITY)}
      />
      <PrimaryButton icon={RotateCcw} label="不合格，重新拍摄" onPress={onRetake} variant="secondary" />
    </>
  );

  return (
    <Page footer={footer}>
      <View style={styles.header}>
        <Eyebrow>Capture Review</Eyebrow>
        <Title>{reviewTitle}</Title>
        <BodyText>{reviewBody}</BodyText>
        {isAnalyzing ? <Pill label="本地照片分析中" tone="neutral" /> : null}
        {nativeAnalysisPassed ? <Pill label="Android ML Kit 自动检查通过" tone="success" /> : null}
        {isNativeBlockingFailure ? <Pill label="自动检查未通过" tone="danger" /> : null}
        {!isAnalyzing && !nativeAnalysisReady ? <Pill label="人工确认 Demo 信号" tone="warning" /> : null}
      </View>

      <View style={styles.previewWrap}>
        {capture.photoUri ? <Image source={{ uri: capture.photoUri }} style={styles.preview} resizeMode="cover" /> : null}
        {analysis?.faceBox ? (
          <View
            pointerEvents="none"
            style={[
              styles.faceBox,
              {
                left: `${analysis.faceBox.x * 100}%`,
                top: `${analysis.faceBox.y * 100}%`,
                width: `${analysis.faceBox.width * 100}%`,
                height: `${analysis.faceBox.height * 100}%`,
              },
            ]}
          />
        ) : null}
        {isAnalyzing ? (
          <View style={styles.analysisOverlay}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : null}
      </View>

      {analysis?.reasons.length ? (
        <Section title={nativeAnalysisReady ? '自动检查结果' : '检查状态'}>
          {analysis.reasons.map((reason, index) => (
            <CheckRow
              key={`${reason}-${index}`}
              icon={nativeAnalysisPassed ? CheckCircle2 : nativeAnalysisReady ? AlertCircle : Bot}
              label={reason}
              tone={nativeAnalysisPassed ? 'success' : nativeAnalysisReady ? 'danger' : 'warning'}
            />
          ))}
        </Section>
      ) : null}

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
  previewWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.ink,
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(15, 138, 95, 0.14)',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
});
