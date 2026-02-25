export type FastType =
  | 'nirjala'
  | 'phalahari'
  | 'ekadashi'
  | 'pradosh'
  | 'purnima'
  | 'amavasya'
  | 'monday'
  | 'thursday'
  | 'saturday'
  | 'navratri'
  | 'custom'
  | 'if_16_8'
  | 'if_18_6'
  | 'if_20_4'
  | 'if_omad'
  | 'if_36'
  | 'if_custom';

export interface FastRecord {
  id: string;
  type: FastType;
  label: string;
  startTime: number;
  endTime: number | null;
  targetDuration: number;
  completed: boolean;
  notes: string;
}

export interface VedicFastDay {
  id: string;
  date: string;
  name: string;
  type: FastType;
  deity: string;
  description: string;
  benefits: string[];
  rules: string[];
  significance: string;
}

export type FastCategory = 'vedic' | 'intermittent';

export interface FastTypeInfo {
  type: FastType;
  name: string;
  deity: string;
  duration: number;
  description: string;
  benefits: string[];
  rules: string[];
  icon: string;
  category: FastCategory;
}

export interface WeeklyStats {
  totalFasts: number;
  totalHours: number;
  completionRate: number;
  streak: number;
}
