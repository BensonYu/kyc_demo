import { Box, ChevronLeft, ScanFace, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Pill, Title } from '../components/TextBlocks';
import { spacing } from '../theme';
import type { KycVerificationRoute } from '../types/kyc';

type RouteSelectionScreenProps = {
  selectedRoute: KycVerificationRoute;
  onSelectRoute: (route: KycVerificationRoute) => void;
  onBack: () => void;
};

export function RouteSelectionScreen({ selectedRoute, onSelectRoute, onBack }: RouteSelectionScreenProps) {
  return (
    <Page
      footer={
        <>
          <PrimaryButton icon={ScanFace} label="ML Kit 人脸检测流程" onPress={() => onSelectRoute('ios_mlkit')} />
          <PrimaryButton icon={Sparkles} label="TrueDepth 增强流程" onPress={() => onSelectRoute('ios_truedepth')} variant="secondary" />
          <PrimaryButton icon={ChevronLeft} label="返回权限页" onPress={onBack} variant="secondary" />
        </>
      }
    >
      <View style={styles.header}>
        <Eyebrow>iOS Route</Eyebrow>
        <Title>选择本地验证路线</Title>
        <BodyText>两条路线都会保留照片和视频在本机。TrueDepth 目前只接入流程入口和接口，原生深度能力待后续 development build 实现。</BodyText>
        <Pill label={selectedRoute === 'ios_truedepth' ? '已选择 TrueDepth route' : '默认 ML Kit route'} tone="neutral" />
      </View>

      <Section title="路线说明">
        <CheckRow icon={ScanFace} label="ML Kit 使用 iOS 本地人脸检测检查单人脸、脸框位置和姿态。" tone="success" />
        <CheckRow icon={Box} label="TrueDepth route 本轮不声称已完成深度活体，只保留后续接 ARKit/AVFoundation 的入口。" tone="warning" />
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
});

