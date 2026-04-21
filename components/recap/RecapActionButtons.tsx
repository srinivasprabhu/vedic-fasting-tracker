import { fs } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Share2, Download, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  onShare: () => void;
  onDownload: () => void;
  isProUser: boolean;
  generatingPdf: boolean;
}

export default function RecapActionButtons({ onShare, onDownload, isProUser, generatingPdf }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        onPress={onShare}
        activeOpacity={0.75}
      >
        <Share2 size={17} color={colors.text} />
        <Text style={[styles.shareLabel, { color: colors.text }]}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.downloadBtn, { backgroundColor: colors.primary, opacity: generatingPdf ? 0.7 : 1 }]}
        onPress={onDownload}
        disabled={generatingPdf}
        activeOpacity={0.85}
      >
        {generatingPdf ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {!isProUser && <Lock size={14} color="#fff" />}
            <Download size={17} color="#fff" />
            <Text style={styles.downloadLabel}>
              {isProUser ? 'Download full report' : 'Unlock full report'}
            </Text>
            {!isProUser && (
              <View style={styles.proPill}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 } as ViewStyle,
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
    } as ViewStyle,
    shareLabel: { fontSize: fs(14), fontWeight: '600' } as TextStyle,
    downloadBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
    } as ViewStyle,
    downloadLabel: { fontSize: fs(14), fontWeight: '700', color: '#fff' } as TextStyle,
    proPill: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 2,
    } as ViewStyle,
    proText: { fontSize: fs(9), fontWeight: '800', color: '#fff', letterSpacing: 0.5 } as TextStyle,
  });
}
