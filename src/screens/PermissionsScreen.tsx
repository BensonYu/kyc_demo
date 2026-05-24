import { Camera, Mic, RotateCcw, Settings } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';

import { Page } from '../components/Page';
import { PrimaryButton } from '../components/PrimaryButton';
import { Section } from '../components/Section';
import { BodyText, CheckRow, Eyebrow, Pill, Title } from '../components/TextBlocks';
import { spacing } from '../theme';
import type { PermissionSignals } from '../types/kyc';

type PermissionsScreenProps = {
  permissions: PermissionSignals;
  onRequest: () => void;
  onContinue: () => void;
  isBusy?: boolean;
  error?: string;
};

export function PermissionsScreen({ permissions, onRequest, onContinue, isBusy, error }: PermissionsScreenProps) {
  const allGranted = permissions.cameraGranted && permissions.microphoneGranted;

  return (
    <Page
      footer={
        <>
          <PrimaryButton
            icon={allGranted ? Camera : RotateCcw}
            label={allGranted ? '进入拍摄' : '请求授权'}
            onPress={allGranted ? onContinue : onRequest}
            loading={isBusy}
          />
          {!allGranted ? (
            <PrimaryButton icon={Settings} label="打开系统设置" onPress={() => Linking.openSettings()} variant="secondary" />
          ) : null}
        </>
      }
    >
      <View style={styles.header}>
        <Eyebrow>Permissions</Eyebrow>
        <Title>授权相机和麦克风</Title>
        <BodyText>拍摄自拍照和 5 秒自拍视频需要相机权限，视频录制需要麦克风权限。</BodyText>
        {error ? <Pill label={error} tone="danger" /> : null}
      </View>

      <Section title="当前权限">
        <CheckRow
          icon={Camera}
          label={permissions.cameraGranted ? '摄像头已授权' : '摄像头未授权'}
          tone={permissions.cameraGranted ? 'success' : 'warning'}
        />
        <CheckRow
          icon={Mic}
          label={permissions.microphoneGranted ? '麦克风已授权' : '麦克风未授权'}
          tone={permissions.microphoneGranted ? 'success' : 'warning'}
        />
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

