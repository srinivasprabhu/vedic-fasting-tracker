import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { ArticleBlock } from '@/types/learn';
import type { ColorScheme } from '@/constants/colors';
import { fs, RADIUS } from '@/constants/theme';

function renderParagraphParts(text: string, baseStyle: TextStyle, boldColor: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) out.push(parts[i]);
    } else {
      out.push(
        <Text key={i} style={[baseStyle, { fontWeight: '700' as const, color: boldColor }]}>
          {parts[i]}
        </Text>,
      );
    }
  }
  return <Text style={baseStyle}>{out}</Text>;
}

export function ArticleRenderer({
  blocks,
  colors,
  isDark = false,
}: {
  blocks: ArticleBlock[];
  colors: ColorScheme;
  isDark?: boolean;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insightBg = isDark ? colors.primaryDark : colors.text;
  /** Dark: body sits on `colors.card` sheet; nested blocks use `surface` for lift vs light’s white-on-cream. */
  const nestedCardBg = isDark ? colors.surface : colors.card;

  return (
    <View style={styles.wrap}>
      {blocks.map((b, i) => {
        const key = `${b.type}-${i}`;
        switch (b.type) {
          case 'heading': {
            const isH2 = b.level === 2;
            return (
              <Text key={key} style={isH2 ? styles.h2 : styles.h3}>
                {b.text}
              </Text>
            );
          }
          case 'paragraph':
            return (
              <View key={key} style={styles.parBlock}>
                {renderParagraphParts(b.text, styles.body, colors.primary)}
              </View>
            );
          case 'quote':
            return (
              <View
                key={key}
                style={[styles.quote, { borderLeftColor: colors.primary, backgroundColor: nestedCardBg }]}
              >
                <Text style={styles.quoteText}>“{b.text}”</Text>
                {b.citation ? (
                  <Text style={[styles.cite, { color: colors.textMuted }]}>{b.citation}</Text>
                ) : null}
              </View>
            );
          case 'keyInsight':
            return (
              <View key={key} style={[styles.insight, { backgroundColor: insightBg, borderColor: colors.border }]}>
                {b.title ? (
                  <Text style={[styles.insightEyebrow, { color: isDark ? colors.textLight : colors.primary }]}>{b.title}</Text>
                ) : null}
                <Text style={[styles.insightBody, { color: colors.textLight }]}>{b.text}</Text>
              </View>
            );
          case 'statPair':
            return (
              <View key={key} style={styles.statRow}>
                <View style={[styles.statCard, { backgroundColor: nestedCardBg, borderColor: colors.borderLight }]}>
                  <Text style={[styles.statVal, { color: colors.primary }]}>{b.left.value}</Text>
                  <Text style={[styles.statLab, { color: colors.textSecondary }]}>{b.left.label}</Text>
                  {b.left.source ? (
                    <Text style={[styles.statSrc, { color: colors.textMuted }]}>{b.left.source}</Text>
                  ) : null}
                </View>
                <View style={[styles.statCard, { backgroundColor: nestedCardBg, borderColor: colors.borderLight }]}>
                  <Text style={[styles.statVal, { color: colors.primary }]}>{b.right.value}</Text>
                  <Text style={[styles.statLab, { color: colors.textSecondary }]}>{b.right.label}</Text>
                  {b.right.source ? (
                    <Text style={[styles.statSrc, { color: colors.textMuted }]}>{b.right.source}</Text>
                  ) : null}
                </View>
              </View>
            );
          case 'timeline':
            return (
              <View key={key} style={[styles.timelineCard, { backgroundColor: nestedCardBg, borderColor: colors.borderLight }]}>
                {b.title ? (
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>{b.title}</Text>
                ) : null}
                {b.items.map((item, j) => (
                  <View key={j} style={styles.tlItem}>
                    <View style={styles.tlRail}>
                      <View style={[styles.tlDot, { backgroundColor: colors.primary }]} />
                      {j < b.items.length - 1 ? (
                        <View style={[styles.tlLine, { backgroundColor: colors.border }]} />
                      ) : null}
                    </View>
                    <View style={styles.tlContent}>
                      <Text style={[styles.tlRange, { color: colors.primary }]}>{item.rangeLabel}</Text>
                      <Text style={[styles.tlItemTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.tlBody, { color: colors.textSecondary }]}>{item.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'mythFact':
            return (
              <View
                key={key}
                style={[
                  styles.mf,
                  {
                    backgroundColor: isDark ? nestedCardBg : colors.surfaceWarm,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.mfEyebrow, { color: colors.textSecondary }]}>MYTH VS. FACT</Text>
                <View style={styles.mfRow}>
                  <Text style={[styles.mfGlyph, { color: colors.error }]}>✕</Text>
                  <Text style={[styles.mfMyth, { color: colors.error }]}>{b.myth}</Text>
                </View>
                <View style={styles.mfRow}>
                  <Text style={[styles.mfGlyph, { color: colors.success }]}>✓</Text>
                  <Text style={[styles.mfFact, { color: colors.text }]}>{b.fact}</Text>
                </View>
              </View>
            );
          case 'bulletList':
            return (
              <View key={key} style={styles.listWrap}>
                {b.items.map((line, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.body, { flex: 1 }]}>{line}</Text>
                  </View>
                ))}
              </View>
            );
          case 'benefitCard':
            return (
              <View
                key={key}
                style={[
                  styles.benCard,
                  {
                    borderColor: (b.accentColor ?? colors.primary) + '40',
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Text style={[styles.benTitle, { color: b.accentColor ?? colors.primary }]}>{b.title}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{b.body}</Text>
              </View>
            );
          case 'protocol':
            return (
              <View key={key} style={[styles.proto, { backgroundColor: nestedCardBg, borderColor: colors.borderLight }]}>
                <Text style={[styles.protoName, { color: colors.text }]}>{b.name}</Text>
                <Text style={[styles.protoHours, { color: colors.primary }]}>{b.hoursLabel}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{b.description}</Text>
                <Text style={[styles.subHead, { color: colors.text }]}>Benefits</Text>
                {b.benefits.map((x, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={[styles.bullet, { color: colors.success }]}>•</Text>
                    <Text style={[styles.bodySm, { flex: 1, color: colors.textSecondary }]}>{x}</Text>
                  </View>
                ))}
                <Text style={[styles.subHead, { color: colors.text }]}>Guidelines</Text>
                {b.rules.map((x, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={[styles.bullet, { color: colors.primary }]}>{j + 1}.</Text>
                    <Text style={[styles.bodySm, { flex: 1, color: colors.textSecondary }]}>{x}</Text>
                  </View>
                ))}
              </View>
            );
          case 'tip':
            return (
              <View
                key={key}
                style={[
                  styles.tip,
                  {
                    backgroundColor: isDark ? colors.surfaceWarm : colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.tipTitle, { color: colors.text }]}>{b.title}</Text>
                <Text style={[styles.bodySm, { color: colors.textSecondary }]}>{b.body}</Text>
              </View>
            );
          case 'foodItem':
            return (
              <View key={key} style={[styles.food, { backgroundColor: nestedCardBg, borderColor: colors.borderLight }]}>
                <Text style={[styles.foodTitle, { color: colors.text }]}>{b.title}</Text>
                <Text style={[styles.bodySm, { color: colors.textSecondary }]}>{b.description}</Text>
                <View style={[styles.sciBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.sciBadgeText, { color: colors.success }]}>{b.scienceNote}</Text>
                </View>
              </View>
            );
          case 'breaksRow':
            return (
              <View key={key} style={[styles.breaks, { backgroundColor: colors.errorLight }]}>
                {b.items.map((label, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={[styles.bullet, { color: colors.error }]}>•</Text>
                    <Text style={[styles.body, { flex: 1, color: colors.text }]}>{label}</Text>
                  </View>
                ))}
              </View>
            );
          case 'scienceCallout':
            return (
              <View
                key={key}
                style={[styles.sci, { backgroundColor: nestedCardBg, borderLeftColor: colors.accent }]}
              >
                <Text style={[styles.sciTitle, { color: colors.text }]}>{b.title}</Text>
                <Text style={[styles.bodySm, { color: colors.textSecondary }]}>{b.body}</Text>
              </View>
            );
          default: {
            const _exhaustive: never = b;
            return _exhaustive;
          }
        }
      })}
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { gap: 16 },
    h2: {
      fontSize: fs(22),
      fontWeight: '700' as const,
      color: colors.text,
      marginTop: 4,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: fs(18),
      fontWeight: '700' as const,
      color: colors.text,
      marginTop: 2,
    },
    body: {
      fontSize: fs(15),
      lineHeight: 22,
      color: colors.text,
    },
    bodySm: {
      fontSize: fs(14),
      lineHeight: 20,
    },
    parBlock: { marginBottom: 0 },
    quote: {
      borderLeftWidth: 4,
      padding: 14,
      borderRadius: RADIUS.md,
    },
    quoteText: {
      fontSize: fs(15),
      fontStyle: 'italic' as const,
      color: colors.text,
      lineHeight: 22,
    },
    cite: { fontSize: fs(12), marginTop: 8 },
    insight: {
      padding: 16,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    insightEyebrow: { fontSize: fs(11), fontWeight: '700' as const, letterSpacing: 1.2, marginBottom: 8 },
    insightBody: { fontSize: fs(15), lineHeight: 22 },
    statRow: { flexDirection: 'row' as const, gap: 10 },
    statCard: {
      flex: 1,
      padding: 14,
      borderRadius: RADIUS.md,
      borderWidth: 1,
    },
    statVal: { fontSize: fs(22), fontWeight: '800' as const, letterSpacing: -0.5 },
    statLab: { fontSize: fs(12), marginTop: 6, lineHeight: 16 },
    statSrc: { fontSize: fs(10), marginTop: 6 },
    timelineCard: { padding: 16, borderRadius: RADIUS.lg, borderWidth: 1 },
    timelineTitle: { fontSize: fs(16), fontWeight: '700' as const, marginBottom: 12 },
    tlItem: { flexDirection: 'row' as const, minHeight: 56 },
    tlRail: { width: 20, alignItems: 'center' as const },
    tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    tlLine: { flex: 1, width: 2, marginVertical: 2 },
    tlContent: { flex: 1, paddingBottom: 14, paddingLeft: 8 },
    tlRange: { fontSize: fs(12), fontWeight: '700' as const },
    tlItemTitle: { fontSize: fs(15), fontWeight: '600' as const, marginTop: 2 },
    tlBody: { fontSize: fs(13), marginTop: 4, lineHeight: 18 },
    mf: { padding: 16, borderRadius: RADIUS.lg, borderWidth: 1 },
    mfEyebrow: { fontSize: fs(11), fontWeight: '700' as const, letterSpacing: 1, marginBottom: 10 },
    mfRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 10 },
    mfGlyph: { fontSize: fs(16), fontWeight: '700' as const, width: 22 },
    mfMyth: { flex: 1, fontSize: fs(14), lineHeight: 20 },
    mfFact: { flex: 1, fontSize: fs(14), lineHeight: 20 },
    listWrap: { gap: 6 },
    listRow: { flexDirection: 'row' as const, gap: 8, alignItems: 'flex-start' as const },
    bullet: { fontSize: fs(15), lineHeight: 22, width: 14 },
    benCard: { padding: 14, borderRadius: RADIUS.md, borderWidth: 1 },
    benTitle: { fontSize: fs(16), fontWeight: '700' as const, marginBottom: 6 },
    proto: { padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 4 },
    protoName: { fontSize: fs(17), fontWeight: '700' as const },
    protoHours: { fontSize: fs(13), fontWeight: '600' as const, marginTop: 2, marginBottom: 8 },
    subHead: { fontSize: fs(14), fontWeight: '700' as const, marginTop: 10, marginBottom: 4 },
    tip: { padding: 12, borderRadius: RADIUS.md, borderWidth: 1 },
    tipTitle: { fontSize: fs(15), fontWeight: '700' as const, marginBottom: 4 },
    food: { padding: 14, borderRadius: RADIUS.md, borderWidth: 1 },
    foodTitle: { fontSize: fs(16), fontWeight: '700' as const, marginBottom: 4 },
    sciBadge: { alignSelf: 'flex-start' as const, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, marginTop: 8 },
    sciBadgeText: { fontSize: fs(11), fontWeight: '600' as const },
    breaks: { padding: 14, borderRadius: RADIUS.md },
    sci: { padding: 14, borderLeftWidth: 4, borderRadius: RADIUS.sm },
    sciTitle: { fontSize: fs(15), fontWeight: '700' as const, marginBottom: 4 },
  } as const);
}

