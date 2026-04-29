import { fs, RADIUS } from '@/constants/theme';
import { useScrollToTop } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { LEARN_QUIZ } from '@/mocks/learn-registry';
import type { QuizQuestion } from '@/types/learn';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ColorScheme } from '@/constants/colors';

export default function LearnQuizScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const quizScrollRef = useRef<ScrollView>(null);
  useScrollToTop(quizScrollRef);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [revealed, setRevealed] = useState(false);

  const q: QuizQuestion | undefined = LEARN_QUIZ.questions[index];
  const total = LEARN_QUIZ.questions.length;
  const progress = total ? (index + (revealed ? 1 : 0)) / total : 0;

  const onPick = useCallback(
    (key: 'A' | 'B' | 'C' | 'D') => {
      if (!q || revealed) return;
      setSelected(key);
      setRevealed(true);
    },
    [q, revealed],
  );

  const onNext = useCallback(() => {
    if (index >= total - 1) {
      router.back();
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }, [index, total, router]);

  if (!q) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}
      >
        <Text style={{ color: colors.text }}>No questions</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle} accessibilityLabel="Back">
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '600' as const }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{LEARN_QUIZ.title}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Question {index + 1} of {total}
          </Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
        <View
          style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` as `${number}%`, backgroundColor: colors.primary }]}
        />
      </View>

      <ScrollView
        ref={quizScrollRef}
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.qEyebrow, { color: colors.primary }]}>QUESTION {index + 1}</Text>
        <Text style={[styles.qTitle, { color: colors.text }]}>{q.prompt}</Text>
        {q.hint ? <Text style={[styles.hint, { color: colors.textSecondary }]}>{q.hint}</Text> : null}

        {q.options.map((opt) => {
          const isSel = selected === opt.key;
          let border = colors.borderLight;
          let bg = colors.card;
          let labelBg = colors.surface;
          let letterColor = colors.text;
          if (revealed) {
            if (opt.key === q.correctKey) {
              border = colors.success;
              bg = colors.successLight;
              labelBg = colors.success;
              letterColor = colors.textLight;
            } else if (isSel) {
              border = colors.error;
              bg = colors.errorLight;
              labelBg = colors.error;
              letterColor = colors.textLight;
            }
          }
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, { borderColor: border, backgroundColor: bg }]}
              onPress={() => onPick(opt.key)}
              disabled={revealed}
              activeOpacity={0.85}
            >
              <View style={[styles.optLetter, { backgroundColor: labelBg }]}>
                <Text style={[styles.optLetterText, { color: letterColor }]}>{opt.key}</Text>
              </View>
              <Text style={[styles.optText, { color: colors.text }]}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}

        {revealed ? (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor: selected !== q.correctKey ? colors.errorLight : colors.successLight,
                borderColor: selected !== q.correctKey ? colors.error : colors.success,
              },
            ]}
          >
            <Text
              style={[
                styles.fbEyebrow,
                { color: selected !== q.correctKey ? colors.error : colors.success },
              ]}
            >
              {selected !== q.correctKey ? 'NOT QUITE' : 'NICE WORK'}
            </Text>
            <Text style={[styles.fbBody, { color: colors.text }]}>
              {selected !== q.correctKey ? q.feedbackWrong : (q.feedbackRight ?? q.feedbackWrong)}
            </Text>
            {q.source ? (
              <Text style={[styles.fbSrc, { color: colors.textMuted }]}>{q.source}</Text>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: revealed ? colors.fastAction : colors.border,
              marginTop: 20,
            },
          ]}
          onPress={onNext}
          disabled={!revealed}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: revealed ? colors.onFastAction : colors.textMuted }]}>
            {index >= total - 1 ? 'Done' : 'Next question →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    backCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
    },
    headerTitle: { fontSize: fs(17), fontWeight: '700' as const },
    headerSub: { fontSize: fs(13), marginTop: 2 },
    progressTrack: { height: 4, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' as const },
    progressFill: { height: '100%' as const, borderRadius: 2 },
    scrollFlex: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 32, flexGrow: 1 },
    qEyebrow: { fontSize: fs(11), fontWeight: '700' as const, letterSpacing: 1.2, marginBottom: 10 },
    qTitle: { fontSize: fs(22), fontWeight: '700' as const, lineHeight: 30, marginBottom: 10 },
    hint: { fontSize: fs(14), lineHeight: 20, marginBottom: 18, fontStyle: 'italic' as const },
    option: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
      borderRadius: RADIUS.md,
      borderWidth: 2,
      marginBottom: 10,
    },
    optLetter: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.sm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    optLetterText: { fontSize: fs(15), fontWeight: '800' as const },
    optText: { flex: 1, fontSize: fs(15), lineHeight: 21 },
    feedback: { marginTop: 16, padding: 16, borderRadius: RADIUS.lg, borderWidth: 1 },
    fbEyebrow: { fontSize: fs(11), fontWeight: '700' as const, letterSpacing: 1, marginBottom: 8 },
    fbBody: { fontSize: fs(14), lineHeight: 20 },
    fbSrc: { fontSize: fs(11), marginTop: 10 },
    nextBtn: { paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center' as const },
    nextBtnText: { fontSize: fs(16), fontWeight: '700' as const },
  });
}
