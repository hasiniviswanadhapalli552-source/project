import { supabase } from '@/lib/supabase';
import type { Student } from '@/types';

export async function fetchAIInsights(students: Student[], question?: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-insights', {
    body: {
      students: students.map((s) => ({
        name: s.name,
        student_id: s.student_id,
        attendance: s.attendance,
        assignment_score: s.assignment_score,
        internal_marks: s.internal_marks,
        previous_marks: s.previous_marks,
        study_hours: s.study_hours,
        final_marks: s.final_marks,
        performance_category: s.performance_category,
      })),
      question,
    },
  });

  if (error) throw error;
  if (!data || typeof data !== 'object') throw new Error('Invalid response from AI insights');
  if (data.error) throw new Error(data.error);
  return data.insight as string;
}
