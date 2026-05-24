import { Camera, CheckCircle2, ScanFace, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Title } from '../components/TextBlocks';
import { spacing } from '../theme';

type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <Page
      footer={<PrimaryButton icon={Camera} label="开始 KYC" onPress={onStart} />}
    >
      <View style={styles.hero}>
        <Eyebrow>Local KYC Demo</Eyebrow>
        <Title>用自拍照和 5 秒自拍视频完成本地演示校验</Title>
        <BodyText>流程会采集自拍照、自拍视频、照片质量确认和动作挑战，所有数据仅用于当前设备上的 Demo 评分。</BodyText>
      </View>

      <Section title="本次会完成">
        <CheckRow icon={Camera} label="打开前置摄像头，采集自拍照和 5 秒自拍视频。" />
        <CheckRow icon={ScanFace} label="拍摄后确认单人脸、在框内、无遮挡且清晰。" />
        <CheckRow icon={ShieldCheck} label="完成动作挑战并生成本地 Mock 风险评分。" />
        <CheckRow icon={CheckCircle2} label="输出通过、重新验证或建议人工复核。" />
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
});
