import { ArrowLeft, Camera, DatabaseZap, ScanFace, Video } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Title } from '../components/TextBlocks';
import { spacing } from '../theme';

type ConsentScreenProps = {
  onAccept: () => void;
  onBack: () => void;
};

export function ConsentScreen({ onAccept, onBack }: ConsentScreenProps) {
  return (
    <Page
      footer={
        <>
          <PrimaryButton label="同意并继续" onPress={onAccept} />
          <PrimaryButton icon={ArrowLeft} label="返回" onPress={onBack} variant="secondary" />
        </>
      }
    >
      <View style={styles.header}>
        <Eyebrow>Consent</Eyebrow>
        <Title>开始前确认隐私和权限</Title>
        <BodyText>这是前端 Demo，不会上传照片或视频。当前版本会要求人工确认照片质量，不假装自动识别人脸位置。</BodyText>
      </View>

      <Section title="需要使用">
        <CheckRow icon={Camera} label="摄像头用于拍摄自拍照。" />
        <CheckRow icon={Video} label="摄像头和麦克风用于录制 5 秒自拍视频。" />
        <CheckRow icon={ScanFace} label="拍摄后需要确认人脸在框内、清晰、无遮挡。" />
        <CheckRow icon={DatabaseZap} label="采集文件只保存在 App 本地会话目录。" />
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
