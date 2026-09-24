import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Loader2,
  Send,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { fetchStudents } from '@/lib/students';
import { fetchAIInsights } from '@/lib/aiInsights';
import {
  computeStats,
  categoryDistribution,
  scatterData,
  generateInsights,
  type Insight,
} from '@/lib/analytics';
import { CATEGORY_COLORS } from '@/types';
import type { Student } from '@/types';

export default function Analytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAskAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await fetchAIInsights(students, question || undefined);
      setAiInsight(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get AI insights');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading analytics..." />
      </Layout>
    );
  }

  if (students.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon={BarChart3}
          title="No data to analyze"
          description="Add students or load sample data from the Dashboard to see analytics."
        />
      </Layout>
    );
  }

  const stats = computeStats(students);
  const catDist = categoryDistribution(students);
  const studyVsMarks = scatterData(students, 'study_hours', 'final_marks');
  const attVsMarks = scatterData(students, 'attendance', 'final_marks');
  const assignVsMarks = scatterData(students, 'assignment_score', 'final_marks');
  const internalVsMarks = scatterData(students, 'internal_marks', 'final_marks');
  const insights = generateInsights(students);

  const insightIcon = (type: Insight['type']) => {
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (type === 'positive') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const insightBg = (type: Insight['type']) => {
    if (type === 'warning') return 'bg-amber-50 border-amber-200';
    if (type === 'positive') return 'bg-green-50 border-green-200';
    return 'bg-blue-50 border-blue-200';
  };

  const scatterColors = (data: { category: string }[]) =>
    data.map((d) => CATEGORY_COLORS[d.category as keyof typeof CATEGORY_COLORS]);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Deep dive into student performance data</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-500">Average Marks</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.avgFinalMarks}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-500">Average Attendance</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.avgAttendance}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <span className="text-sm text-slate-500">Pass Percentage</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.passPercentage}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-slate-500">Total Students</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalStudents}</p>
        </div>
      </div>

      {/* Category distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Performance Category Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={catDist}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {catDist.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[
          { title: 'Attendance vs Final Marks', data: attVsMarks, xName: 'Attendance' },
          { title: 'Study Hours vs Final Marks', data: studyVsMarks, xName: 'Study Hours' },
          { title: 'Assignment Score vs Final Marks', data: assignVsMarks, xName: 'Assignment Score' },
          { title: 'Internal Marks vs Final Marks', data: internalVsMarks, xName: 'Internal Marks' },
        ].map((chart) => (
          <div key={chart.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name={chart.xName} tick={{ fontSize: 12 }} />
                <YAxis type="number" dataKey="y" name="Final Marks" tick={{ fontSize: 12 }} />
                <ZAxis range={[60, 60]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => value.toFixed(1)} />
                <Scatter data={chart.data} fill="#3b82f6">
                  {scatterColors(chart.data).map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Data-Driven Insights</h3>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border ${insightBg(insight.type)}`}
            >
              {insightIcon(insight.type)}
              <p className="text-sm text-slate-700">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">AI-Powered Analysis</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Ask a question about your student data, or click analyze for a comprehensive AI-generated report.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Which students need the most attention?"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAskAI}
            disabled={aiLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Analyze
          </button>
        </div>
        {aiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-400">{aiError}</p>
          </div>
        )}
        {aiLoading && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">AI is analyzing your data...</p>
          </div>
        )}
        {aiInsight && !aiLoading && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
