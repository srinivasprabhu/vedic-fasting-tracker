/**
 * Learn hub: articles (block-based body) and quiz.
 */

export type ArticleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type LearnSectionId =
  | 'start_here'
  | 'on_a_fast'
  | 'protocols'
  | 'hormones_longevity'
  | 'gut_brain';

export type ArticleBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string; citation?: string }
  | { type: 'keyInsight'; title?: string; text: string }
  | {
      type: 'statPair';
      left: { value: string; label: string; source?: string };
      right: { value: string; label: string; source?: string };
    }
  | {
      type: 'timeline';
      title?: string;
      items: { rangeLabel: string; title: string; body: string }[];
    }
  | { type: 'mythFact'; myth: string; fact: string }
  | { type: 'bulletList'; items: string[] }
  | {
      type: 'benefitCard';
      title: string;
      body: string;
      accentColor?: string;
    }
  | {
      type: 'protocol';
      name: string;
      hoursLabel: string;
      description: string;
      benefits: string[];
      rules: string[];
    }
  | { type: 'tip'; title: string; body: string }
  | { type: 'foodItem'; title: string; description: string; scienceNote: string }
  | { type: 'breaksRow'; items: string[] }
  | { type: 'scienceCallout'; title: string; body: string };

export interface ArticleSummary {
  id: string;
  title: string;
  subtitle: string;
  difficulty: ArticleDifficulty;
  readMinutes: number;
  sectionIds: LearnSectionId[];
  /** Shown in horizontal “Start here” strip */
  featured?: boolean;
  topicTag?: string;
  /** Lucide icon name for Learn hub list rows (see ICON_MAP in knowledge/index). */
  hubIcon?: string;
  /** Icon circle tint (hex). */
  hubIconColor?: string;
}

export interface ArticleDetail extends ArticleSummary {
  badges?: string[];
  updatedYear?: number;
  relatedIds: string[];
  blocks: ArticleBlock[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  hint?: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  feedbackWrong: string;
  feedbackRight?: string;
  source?: string;
}

export interface LearnQuiz {
  id: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  questions: QuizQuestion[];
}
