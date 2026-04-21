import { fs } from '@/constants/theme';
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator,
  Platform, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import SummaryCard from '@/components/share/SummaryCard';
import { captureSummaryCard, shareCapturedCard } from '@/utils/shareCard';
import type { MonthlyReportData } from '@/utils/monthly-report';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  data: MonthlyReportData | null;
}

const CARD_DISPLAY_SIZE = 360;

export default function ShareSummaryModal({ visible, onClose, data }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const cardRef = useRef<View | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharing(true);
    try {
      const uri = await captureSummaryCard(cardRef, { cardSize: CARD_DISPLAY_SIZE });
      if (!uri) {
        return;
      }
      const shared = await shareCapturedCard(uri, data.monthLabel);
      if (shared) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setSharing(false);
    }
  }, [data]);

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Share your month</Text>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.preview}>
          <SummaryCard ref={cardRef} data={data} />
        </View>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Share to Instagram, WhatsApp, or wherever you connect with friends.
        </Text>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary, opacity: sharing ? 0.7 : 1 }]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Share2 size={18} color="#fff" />
                <Text style={styles.shareLabel}>Share to…</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    } as ViewStyle,
    title: { fontSize: fs(18), fontWeight: '700' } as TextStyle,
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    } as ViewStyle,
    preview: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    } as ViewStyle,
    hint: {
      fontSize: fs(13),
      textAlign: 'center',
      paddingHorizontal: 32,
      marginTop: 16,
      lineHeight: 18,
    } as TextStyle,
    actionBar: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 8 : 20,
    } as ViewStyle,
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 14,
    } as ViewStyle,
    shareLabel: { fontSize: fs(15), fontWeight: '700', color: '#fff' } as TextStyle,
  });
}
