import type { Student } from '@/types';
import { getCategoryFromMarks, CATEGORIES } from '@/types';

export interface DashboardStats {
  totalStudents: number;
  avgAttendance: number;
  avgFinalMarks: number;
  passPercentage: number;
  studentsNeedingAttention: number;
}

export function computeStats(students: Student[]): DashboardStats {
  const total = students.length;
  if (total === 0) {
    return { totalStudents: 0, avgAttendance: 0, avgFinalMarks: 0, passPercentage: 0, studentsNeedingAttention: 0 };
  }
  const avgAttendance = students.reduce((s, st) => s + Number(st.attendance ?? 0), 0) / total;
  const avgFinalMarks = students.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / total;
  const passed = students.filter((s) => Number(s.final_marks ?? 0) >= 50).length;
  const passPercentage = (passed / total) * 100;
  const studentsNeedingAttention = students.filter(
    (s) => Number(s.attendance ?? 0) < 75 || Number(s.final_marks ?? 0) < 50 || getCategoryFromMarks(Number(s.final_marks ?? 0)) === 'Needs Improvement'
  ).length;

  return {
    totalStudents: total,
    avgAttendance: Math.round(avgAttendance * 100) / 100,
    avgFinalMarks: Math.round(avgFinalMarks * 100) / 100,
    passPercentage: Math.round(passPercentage * 100) / 100,
    studentsNeedingAttention,
  };
}

export function categoryDistribution(students: Student[]) {
  const dist = CATEGORIES.map((c) => ({ category: c, count: 0 }));
  students.forEach((s) => {
    const cat = getCategoryFromMarks(Number(s.final_marks ?? 0));
    const entry = dist.find((d) => d.category === cat);
    if (entry) entry.count++;
  });
  return dist;
}

export function attendanceBuckets(students: Student[]) {
  const buckets = [
    { range: '0-50%', count: 0 },
    { range: '51-65%', count: 0 },
    { range: '66-75%', count: 0 },
    { range: '76-85%', count: 0 },
    { range: '86-100%', count: 0 },
  ];
  students.forEach((s) => {
    const a = Number(s.attendance ?? 0);
    if (a <= 50) buckets[0].count++;
    else if (a <= 65) buckets[1].count++;
    else if (a <= 75) buckets[2].count++;
    else if (a <= 85) buckets[3].count++;
    else buckets[4].count++;
  });
  return buckets;
}

export function scatterData(students: Student[], xKey: keyof Student, yKey: keyof Student) {
  return students.map((s) => ({
    x: Number(s[xKey] ?? 0),
    y: Number(s[yKey] ?? 0),
    name: s.name,
  category: getCategoryFromMarks(Number(s.final_marks ?? 0)),
  }));
}

export interface Insight {
  text: string;
  type: 'warning' | 'positive' | 'neutral';
}

export function generateInsights(students: Student[]): Insight[] {
  if (students.length === 0) return [];
  const insights: Insight[] = [];

  // Attendance vs marks
  const lowAttendance = students.filter((s) => Number(s.attendance ?? 0) < 75);
  const highAttendance = students.filter((s) => Number(s.attendance ?? 0) >= 75);
  if (lowAttendance.length > 0 && highAttendance.length > 0) {
    const lowAvg = lowAttendance.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / lowAttendance.length;
    const highAvg = highAttendance.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / highAttendance.length;
    if (lowAvg < highAvg) {
      insights.push({
        text: `Students with attendance below 75% average ${lowAvg.toFixed(1)} final marks, compared to ${highAvg.toFixed(1)} for those above 75%.`,
        type: 'warning',
      });
    }
  }

  // Study hours vs marks
  const lowStudy = students.filter((s) => Number(s.study_hours ?? 0) < 15);
  const highStudy = students.filter((s) => Number(s.study_hours ?? 0) >= 20);
  if (lowStudy.length > 0 && highStudy.length > 0) {
    const lowAvg = lowStudy.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / lowStudy.length;
    const highAvg = highStudy.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / highStudy.length;
    if (highAvg > lowAvg) {
      insights.push({
        text: `Students studying 20+ hours/week average ${highAvg.toFixed(1)} marks vs ${lowAvg.toFixed(1)} for those studying under 15 hours.`,
        type: 'warning',
      });
    }
  }

  // Assignment score correlation
  const lowAssign = students.filter((s) => Number(s.assignment_score ?? 0) < 60);
  const highAssign = students.filter((s) => Number(s.assignment_score ?? 0) >= 75);
  if (lowAssign.length > 0 && highAssign.length > 0) {
    const lowAvg = lowAssign.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / lowAssign.length;
    const highAvg = highAssign.reduce((s, st) => s + Number(st.final_marks ?? 0), 0) / highAssign.length;
    if (highAvg > lowAvg) {
      insights.push({
        text: `Students with assignment scores above 75% average ${highAvg.toFixed(1)} final marks, while those below 60% average ${lowAvg.toFixed(1)}.`,
        type: 'neutral',
      });
    }
  }

  // Pass rate
  const passRate = (students.filter((s) => Number(s.final_marks ?? 0) >= 50).length / students.length) * 100;
  if (passRate >= 80) {
    insights.push({
      text: `Overall pass rate is ${passRate.toFixed(1)}%, indicating strong overall performance.`,
      type: 'positive',
    });
  } else if (passRate < 60) {
    insights.push({
      text: `Overall pass rate is only ${passRate.toFixed(1)}%, suggesting a need for academic intervention.`,
      type: 'warning',
    });
  }

  // Top performers
  const excellent = students.filter((s) => Number(s.final_marks ?? 0) >= 80);
  if (excellent.length > 0) {
    insights.push({
      text: `${excellent.length} student${excellent.length > 1 ? 's' : ''} scored 80+ marks (Excellent category).`,
      type: 'positive',
    });
  }

  // At-risk
  const atRisk = students.filter(
    (s) => Number(s.attendance ?? 0) < 75 || Number(s.final_marks ?? 0) < 50
  );
  if (atRisk.length > 0) {
    insights.push({
      text: `${atRisk.length} student${atRisk.length > 1 ? 's' : ''} flagged as at-risk (low attendance or failing marks).`,
      type: 'warning',
    });
  }

  return insights;
}

export function getAtRiskStudents(students: Student[]) {
  return students
    .filter(
      (s) =>
        Number(s.attendance ?? 0) < 75 ||
        Number(s.final_marks ?? 0) < 50 ||
        getCategoryFromMarks(Number(s.final_marks ?? 0)) === 'Needs Improvement'
    )
    .map((s) => {
      const reasons: string[] = [];
      if (Number(s.attendance ?? 0) < 75) reasons.push(`Low attendance (${s.attendance}%)`);
      if (Number(s.final_marks ?? 0) < 50) reasons.push(`Failing marks (${s.final_marks})`);
      if (getCategoryFromMarks(Number(s.final_marks ?? 0)) === 'Needs Improvement' && Number(s.final_marks ?? 0) >= 50) {
        reasons.push('Needs Improvement category');
      }
      return { student: s, reasons };
    });
}
