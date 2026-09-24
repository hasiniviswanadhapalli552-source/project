import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Target,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { fetchStudents } from '@/lib/students';
import { trainModel, clearModel, type TrainingResult } from '@/lib/ml';
import { CATEGORIES, CATEGORY_COLORS } from '@/types';
import type { Student } from '@/types';

export default function AITraining() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [epochs, setEpochs] = useState(100);

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    setError(null);
    try {
      const res = await trainModel(students, epochs);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleReset = () => {
    clearModel();
    setResult(null);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading data..." />
      </Layout>
    );
  }

  if (students.length < 6) {
    return (
      <Layout>
        <EmptyState
          icon={Brain}
          title="Add more student records to train the model"
          description={`You currently have ${students.length} student records. At least 6 are needed to train the ML model.`}
          action={
            <button
              onClick={() => navigate('/students')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
            >
              Go to Students
            </button>
          }
        />
      </Layout>
    );
  }

  const accuracyData = result?.perClassAccuracy.map((c) => ({
    category: c.category,
    accuracy: Math.round(c.accuracy * 100),
  })) ?? [];

  const lossHistory = result?.history.loss.map((l, i) => ({
    epoch: i + 1,
    loss: l,
    acc: result.history.acc[i],
  })) ?? [];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Model Training</h1>
        <p className="text-slate-500 mt-1">Train a neural network using TensorFlow.js to predict student performance</p>
      </div>

      {/* Training Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Neural Network Classifier</h3>
            <p className="text-sm text-slate-500">
              {students.length} records available. Features: Attendance, Assignment Score, Internal Marks, Previous Marks, Study Hours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Epochs</label>
              <input
                type="number"
                min={20}
                max={500}
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
                className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleTrain}
              disabled={training}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-all"
            >
              {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {training ? 'Training...' : 'Train Model'}
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {training && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-blue-700 font-medium">Training model with {epochs} epochs... This may take a moment.</p>
        </div>
      )}

      {result && !training && (
        <>
          {/* Training Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-slate-500">Training Samples</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{result.trainSamples}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-500">Testing Samples</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{result.testSamples}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-slate-500">Model Accuracy</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{(result.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-slate-500">Epochs</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{result.epochs}</p>
            </div>
          </div>

          {/* Training History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Training History (Loss & Accuracy)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lossHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epoch" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#ef4444" name="Loss" dot={false} />
                <Line type="monotone" dataKey="acc" stroke="#10b981" name="Accuracy" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Per-class accuracy */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Per-Category Accuracy</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                  {accuracyData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Confusion Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-sm font-semibold text-slate-500 p-2 text-left">Actual \ Predicted</th>
                    {CATEGORIES.map((c) => (
                      <th key={c} className="text-xs font-semibold text-slate-600 p-2 text-center">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((actualRow, i) => (
                    <tr key={actualRow}>
                      <td className="text-sm font-medium text-slate-700 p-2">{actualRow}</td>
                      {CATEGORIES.map((_, j) => {
                        const val = result.confusionMatrix[i][j];
                        const isDiagonal = i === j;
                        return (
                          <td key={j} className="p-2 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold ${
                                isDiagonal
                                  ? 'bg-green-100 text-green-700'
                                  : val > 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-50 text-slate-400'
                              }`}
                            >
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Go to prediction */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/ai-prediction')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <Target className="w-5 h-5" />
              Try AI Prediction
            </button>
          </div>
        </>
      )}

      {!result && !training && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Train</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Click "Train Model" to build a neural network that classifies students into performance categories based on their academic features.
          </p>
        </div>
      )}
    </Layout>
  );
}
