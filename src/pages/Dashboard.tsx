import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Database,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { fetchStudents, bulkInsertStudents } from '@/lib/students';
import { computeStats, categoryDistribution, attendanceBuckets, scatterData } from '@/lib/analytics';
import { CATEGORY_COLORS, CATEGORIES } from '@/types';
import type { Student } from '@/types';
import { SAMPLE_STUDENTS } from '@/lib/sampleData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      await bulkInsertStudents(SAMPLE_STUDENTS);
      await load();
    } catch {
      alert('Failed to load sample data. Make sure you are signed in.');
    } finally {
      setLoadingSample(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading dashboard..." />
      </Layout>
    );
  }

  const stats = computeStats(students);
  const catDist = categoryDistribution(students);
  const attBuckets = attendanceBuckets(students);
  const studyVsMarks = scatterData(students, 'study_hours', 'final_marks');
  const attVsMarks = scatterData(students, 'attendance', 'final_marks');

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of student academic performance</p>
      </div>

      {students.length === 0 && (
        <EmptyState
          icon={Database}
          title="No student data yet"
          description="Load sample data to get started, or add students manually from the Students page."
          action={
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
            >
              {loadingSample ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Load Sample Data
            </button>
          }
        />
      )}

      {students.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="bg-blue-600" />
            <StatCard label="Avg Attendance" value={`${stats.avgAttendance}%`} icon={CalendarCheck} color="bg-green-600" />
            <StatCard label="Avg Final Marks" value={stats.avgFinalMarks} icon={GraduationCap} color="bg-amber-500" />
            <StatCard label="Pass Rate" value={`${stats.passPercentage}%`} icon={TrendingUp} color="bg-teal-600" />
            <StatCard label="Need Attention" value={stats.studentsNeedingAttention} icon={AlertTriangle} color="bg-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Performance Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={catDist}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category, count }) => `${category}: ${count}`}
                  >
                    {catDist.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Attendance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Study Hours vs Final Marks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name="Study Hours" tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name="Final Marks" tick={{ fontSize: 12 }} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => value.toFixed(1)} />
                  <Scatter data={studyVsMarks}>
                    {studyVsMarks.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Attendance vs Final Marks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name="Attendance" tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name="Final Marks" tick={{ fontSize: 12 }} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => value.toFixed(1)} />
                  <Scatter data={attVsMarks}>
                    {attVsMarks.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <span className="text-slate-600">{cat}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate('/students')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
            >
              Manage Students
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all"
            >
              View Analytics
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}
