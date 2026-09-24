import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { fetchStudents } from '@/lib/students';
import { getAtRiskStudents } from '@/lib/analytics';
import { getCategoryFromMarks, CATEGORY_COLORS } from '@/types';
import type { Student } from '@/types';

export default function AtRiskStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading at-risk students..." />
      </Layout>
    );
  }

  if (students.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon={AlertTriangle}
          title="No student data"
          description="Add students or load sample data to identify at-risk students."
        />
      </Layout>
    );
  }

  const atRisk = getAtRiskStudents(students);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">At-Risk Students</h1>
        <p className="text-slate-500 mt-1">Students who may need academic attention</p>
      </div>

      {atRisk.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No at-risk students"
          description="All students are performing above the risk thresholds. Great job!"
        />
      ) : (
        <>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">
              <strong>{atRisk.length}</strong> student{atRisk.length > 1 ? 's' : ''} flagged as at-risk. Students are flagged when attendance is below 75%, final marks are below 50, or their performance category is "Needs Improvement".
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Student ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Attendance</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Final Marks</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Risk Reason</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map(({ student: s, reasons }) => {
                    const cat = getCategoryFromMarks(Number(s.final_marks ?? 0));
                    return (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{s.student_id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              Number(s.attendance ?? 0) < 75 ? 'text-red-600' : 'text-slate-600'
                            }`}
                          >
                            {s.attendance}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              Number(s.final_marks ?? 0) < 50 ? 'text-red-600' : 'text-slate-600'
                            }`}
                          >
                            {s.final_marks}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                          >
                            {cat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {reasons.map((r, i) => (
                              <span key={i} className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block w-fit">
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/students/${s.id}`)}
                            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
