import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { FastRecord, FastType } from '@/types/fasting';

const STORAGE_KEY = 'vedic_fasting_records';

async function loadRecords(): Promise<FastRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.log('Failed to load fasting records:', e);
    return [];
  }
}

async function saveRecords(records: FastRecord[]): Promise<FastRecord[]> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.log('Failed to save fasting records:', e);
  }
  return records;
}

export const [FastingProvider, useFasting] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [records, setRecords] = useState<FastRecord[]>([]);
  const [activeFast, setActiveFast] = useState<FastRecord | null>(null);
  const [lastCompletedFast, setLastCompletedFast] = useState<FastRecord | null>(null);

  const recordsQuery = useQuery({
    queryKey: ['fasting-records'],
    queryFn: loadRecords,
  });

  const saveMutation = useMutation({
    mutationFn: saveRecords,
  });

  useEffect(() => {
    if (recordsQuery.data) {
      setRecords(recordsQuery.data);
      const active = recordsQuery.data.find(r => r.endTime === null);
      if (active) {
        setActiveFast(active);
      }
    }
  }, [recordsQuery.data]);

  const startFast = useCallback((type: FastType, label: string, targetDuration: number, customStartTime?: number) => {
    const startTime = customStartTime ?? Date.now();
    const newFast: FastRecord = {
      id: `fast-${Date.now()}`,
      type,
      label,
      startTime,
      endTime: null,
      targetDuration,
      completed: false,
      notes: '',
    };
    const updated = [newFast, ...records];
    setRecords(updated);
    setActiveFast(newFast);
    saveMutation.mutate(updated);
    console.log('Started fast:', newFast.label, 'at', new Date(startTime).toISOString());
  }, [records, saveMutation]);

  const endFast = useCallback((completed: boolean, customEndTime?: number) => {
    if (!activeFast) return;
    const endTime = customEndTime ?? Date.now();
    const finishedFast: FastRecord = { ...activeFast, endTime, completed };
    const updated = records.map(r =>
      r.id === activeFast.id
        ? finishedFast
        : r
    );
    setRecords(updated);
    setActiveFast(null);
    setLastCompletedFast(finishedFast);
    saveMutation.mutate(updated);
    console.log('Ended fast:', activeFast.label, 'at', new Date(endTime).toISOString(), completed ? '(completed)' : '(cancelled)');
  }, [activeFast, records, saveMutation]);

  const clearLastCompleted = useCallback(() => {
    setLastCompletedFast(null);
  }, []);

  const completedRecords = useMemo(() =>
    records.filter(r => r.endTime !== null),
    [records]
  );

  const streak = useMemo(() => {
    const completed = completedRecords
      .filter(r => r.completed)
      .sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0));

    if (completed.length === 0) return 0;

    let count = 0;
    const now = new Date();
    const dayMs = 86400000;

    for (let i = 0; i < completed.length; i++) {
      const fastDate = new Date(completed[i].endTime ?? 0);
      const daysDiff = Math.floor((now.getTime() - fastDate.getTime()) / dayMs);
      if (daysDiff <= count + 7) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [completedRecords]);

  const totalHours = useMemo(() => {
    return completedRecords.reduce((sum, r) => {
      const duration = (r.endTime ?? 0) - r.startTime;
      return sum + duration / 3600000;
    }, 0);
  }, [completedRecords]);

  const thisWeekRecords = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return completedRecords.filter(r => r.startTime >= weekAgo);
  }, [completedRecords]);

  const thisMonthRecords = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86400000;
    return completedRecords.filter(r => r.startTime >= monthAgo);
  }, [completedRecords]);

  return {
    records,
    activeFast,
    completedRecords,
    streak,
    totalHours,
    thisWeekRecords,
    thisMonthRecords,
    startFast,
    endFast,
    lastCompletedFast,
    clearLastCompleted,
    isLoading: recordsQuery.isLoading,
  };
});
