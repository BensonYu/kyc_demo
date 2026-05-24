import { CheckCircle2, Gauge, ScanFace, Video } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Title } from '../components/TextBlocks';
import { colors, spacing } from '../theme';

export function ProcessingScreen() {
  return (
    <Page scroll={false}>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <View style={styles.header}>
          <Eyebrow>Processing</Eyebrow>
          <Title>正在进行本地演示校验</Title>
          <BodyText>我们会检查照片质量确认、5 秒自拍视频和动作挑战，然后生成 Mock 风险评分。</BodyText>
        </View>
        <Section title="检查进度">
          <CheckRow icon={Video} label="确认自拍照和自拍视频已采集。" />
          <CheckRow icon={ScanFace} label="合并照片质量确认信号。" />
          <CheckRow icon={CheckCircle2} label="检查动作挑战结果。" />
          <CheckRow icon={Gauge} label="计算本地 Mock 风险评分。" />
        </Section>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.lg,
  },
});
