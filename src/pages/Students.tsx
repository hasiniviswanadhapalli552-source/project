import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Loader2,
  Database,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { fetchStudents, createStudent, updateStudent, deleteStudent, bulkInsertStudents } from '@/lib/students';
import { getCategoryFromMarks, CATEGORY_COLORS } from '@/types';
import type { Student, StudentInput } from '@/types';
import { SAMPLE_STUDENTS } from '@/lib/sampleData';

const emptyForm: StudentInput = {
  student_id: '',
  name: '',
  gender: 'Male',
  age: 18,
  attendance: 75,
  assignment_score: 70,
  internal_marks: 70,
  previous_marks: 70,
  study_hours: 15,
  final_marks: 70,
};

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      student_id: s.student_id,
      name: s.name,
      gender: s.gender ?? 'Male',
      age: s.age ?? 18,
      attendance: Number(s.attendance ?? 0),
      assignment_score: Number(s.assignment_score ?? 0),
      internal_marks: Number(s.internal_marks ?? 0),
      previous_marks: Number(s.previous_marks ?? 0),
      study_hours: Number(s.study_hours ?? 0),
      final_marks: Number(s.final_marks ?? 0),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateStudent(editing.id, form);
      } else {
        await createStudent(form);
      }
      await load();
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      await load();
      setDeleteTarget(null);
    } catch {
      alert('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      await bulkInsertStudents(SAMPLE_STUDENTS);
      await load();
    } catch {
      alert('Failed to load sample data');
    } finally {
      setLoadingSample(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading students..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage and view all student records</p>
        </div>
        <div className="flex gap-2">
          {students.length === 0 && (
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl flex items-center gap-2 transition-all"
            >
              {loadingSample ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Load Sample
            </button>
          )}
          <button
            onClick={openAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Add your first student or load sample data to get started."
          action={
            <button
              onClick={openAdd}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          }
        />
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Student ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Attendance</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Assignment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Internal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Previous</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Study Hrs</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Final</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const cat = getCategoryFromMarks(Number(s.final_marks ?? 0));
                    return (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{s.student_id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.attendance}%</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.assignment_score}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.internal_marks}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.previous_marks}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.study_hours}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.final_marks}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                          >
                            {cat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/students/${s.id}`)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(s)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">No students match your search.</div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender ?? 'Male'}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={form.age ?? 18}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attendance (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={form.attendance ?? 0}
                    onChange={(e) => setForm({ ...form, attendance: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Score</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={form.assignment_score ?? 0}
                    onChange={(e) => setForm({ ...form, assignment_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Internal Marks</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={form.internal_marks ?? 0}
                    onChange={(e) => setForm({ ...form, internal_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Previous Marks</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={form.previous_marks ?? 0}
                    onChange={(e) => setForm({ ...form, previous_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Study Hours/week</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step="0.5"
                    required
                    value={form.study_hours ?? 0}
                    onChange={(e) => setForm({ ...form, study_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Final Marks</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={form.final_marks ?? 0}
                    onChange={(e) => setForm({ ...form, final_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Update' : 'Add'} Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Student?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.student_id})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
