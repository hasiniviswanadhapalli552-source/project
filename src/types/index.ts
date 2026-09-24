export interface Student {
  id: string;
  student_id: string;
  name: string;
  gender: string | null;
  age: number | null;
  attendance: number | null;
  assignment_score: number | null;
  internal_marks: number | null;
  previous_marks: number | null;
  study_hours: number | null;
  final_marks: number | null;
  performance_category: string | null;
  created_at: string;
}

export type StudentInput = Omit<Student, 'id' | 'created_at' | 'performance_category'>;

export type PerformanceCategory = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';

export const CATEGORIES: PerformanceCategory[] = [
  'Excellent',
  'Good',
  'Average',
  'Needs Improvement',
];

export function getCategoryFromMarks(marks: number): PerformanceCategory {
  if (marks >= 80) return 'Excellent';
  if (marks >= 65) return 'Good';
  if (marks >= 50) return 'Average';
  return 'Needs Improvement';
}

export const CATEGORY_COLORS: Record<PerformanceCategory, string> = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Average: '#f59e0b',
  'Needs Improvement': '#ef4444',
};
