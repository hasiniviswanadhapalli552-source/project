import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  FileText,
  BookOpen,
  History,
  Clock,
  GraduationCap,
  User,
  Brain,
  Loader2,
  Target,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchStudent } from '@/lib/students';
import { predict, isModelTrained, type PredictionResult } from '@/lib/ml';
import { getCategoryFromMarks, CATEGORY_COLORS, CATEGORIES } from '@/types';
import type { Student, PerformanceCategory } from '@/types';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchStudent(id)
      .then((data) => {
        setStudent(data);
        if (data && isModelTrained()) {
          setPredicting(true);
          predict({
            attendance: Number(data.attendance ?? 0),
            assignment_score: Number(data.assignment_score ?? 0),
            internal_marks: Number(data.internal_marks ?? 0),
            previous_marks: Number(data.previous_marks ?? 0),
            study_hours: Number(data.study_hours ?? 0),
          })
            .then(setPrediction)
            .catch(() => setPrediction(null))
            .finally(() => setPredicting(false));
        }
      })
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading student..." />
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-slate-500">Student not found.</p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
          >
            Back to Students
          </button>
        </div>
      </Layout>
    );
  }

  const category = getCategoryFromMarks(Number(student.final_marks ?? 0));
  const isAtRisk =
    Number(student.attendance ?? 0) < 75 ||
    Number(student.final_marks ?? 0) < 50 ||
    category === 'Needs Improvement';

  const radarData = [
    { metric: 'Attendance', value: Number(student.attendance ?? 0) },
    { metric: 'Assignment', value: Number(student.assignment_score ?? 0) },
    { metric: 'Internal', value: Number(student.internal_marks ?? 0) },
    { metric: 'Previous', value: Number(student.previous_marks ?? 0) },
    { metric: 'Study Hours', value: Math.min(Number(student.study_hours ?? 0) * 2.5, 100) },
    { metric: 'Final Marks', value: Number(student.final_marks ?? 0) },
  ];

  const metrics = [
    { label: 'Attendance', value: `${student.attendance}%`, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Assignment Score', value: student.assignment_score, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Internal Marks', value: student.internal_marks, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Previous Marks', value: student.previous_marks, icon: History, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Study Hours/week', value: student.study_hours, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Final Marks', value: student.final_marks, icon: GraduationCap, color: 'text-slate-900', bg: 'bg-slate-100' },
  ];

  return (
    <Layout>
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
              <p className="text-slate-500 text-sm">
                {student.student_id} · {student.gender} · {student.age} years old
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
            >
              {category}
            </span>
            {isAtRisk && (
              <span className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-red-500">
                At Risk
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Academic Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className={`rounded-xl p-4 ${m.bg}`}>
                <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
                <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke={CATEGORY_COLORS[category]}
                fill={CATEGORY_COLORS[category]}
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Prediction for this student */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">AI Prediction for This Student</h3>
        </div>

        {predicting && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-slate-500">Running AI prediction...</p>
          </div>
        )}

        {!predicting && !prediction && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700">
              No trained model available. Train the model on the{' '}
              <button onClick={() => navigate('/ai-training')} className="underline font-medium">
                AI Training page
              </button>{' '}
              to see predictions for this student.
            </p>
          </div>
        )}

        {!predicting && prediction && (
          <div>
            <div
              className="rounded-xl p-6 text-center mb-4"
              style={{ backgroundColor: `${CATEGORY_COLORS[prediction.category]}15` }}
            >
              <p className="text-sm text-slate-500 mb-1">AI Predicted Performance</p>
              <p
                className="text-3xl font-bold"
                style={{ color: CATEGORY_COLORS[prediction.category] }}
              >
                {prediction.category}
              </p>
            </div>
            <div className="space-y-2">
              {prediction.probabilities.map((p) => (
                <div key={p.category} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-32 flex-shrink-0">{p.category}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${p.probability * 100}%`,
                        backgroundColor: CATEGORY_COLORS[p.category],
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-12 text-right">
                    {(p.probability * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              This prediction is based on the student's input features and the trained ML model. It is not a guarantee of actual performance.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
