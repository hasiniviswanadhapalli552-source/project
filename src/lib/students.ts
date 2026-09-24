import { supabase } from '@/lib/supabase';
import type { Student, StudentInput } from '@/types';
import { getCategoryFromMarks } from '@/types';

function withCategory(data: Partial<StudentInput> & { final_marks?: number | null }): Partial<Student> {
  if (data.final_marks != null) {
    return { ...data, performance_category: getCategoryFromMarks(data.final_marks) };
  }
  return data;
}

export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchStudent(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const payload = withCategory(input);
  const { data, error } = await supabase
    .from('students')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id: string, input: Partial<StudentInput>): Promise<Student> {
  const payload = withCategory(input);
  const { data, error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkInsertStudents(inputs: StudentInput[]): Promise<void> {
  const payloads = inputs.map((input) => withCategory(input));
  const { error } = await supabase.from('students').insert(payloads);
  if (error) throw error;
}
