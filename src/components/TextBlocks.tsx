import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, radii, spacing } from '../theme';

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function BodyText({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function CheckRow({ icon: Icon, label, tone = 'neutral' }: { icon: LucideIcon; label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.primary;
  return (
    <View style={styles.row}>
      <View style={[styles.iconBubble, { backgroundColor: toneToSoftColor(tone) }]}>
        <Icon color={color} size={18} strokeWidth={2.2} />
      </View>
      <Text style={styles.rowText}>{label}</Text>
    </View>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return (
    <View style={[styles.pill, { backgroundColor: toneToSoftColor(tone) }]}>
      <Text style={[styles.pillText, { color: toneToColor(tone) }]}>{label}</Text>
    </View>
  );
}

function toneToSoftColor(tone: 'neutral' | 'success' | 'warning' | 'danger') {
  if (tone === 'success') {
    return colors.successSoft;
  }
  if (tone === 'warning') {
    return colors.warningSoft;
  }
  if (tone === 'danger') {
    return colors.dangerSoft;
  }
  return colors.primarySoft;
}

function toneToColor(tone: 'neutral' | 'success' | 'warning' | 'danger') {
  if (tone === 'success') {
    return colors.success;
  }
  if (tone === 'warning') {
    return colors.warning;
  }
  if (tone === 'danger') {
    return colors.danger;
  }
  return colors.primary;
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  body: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

