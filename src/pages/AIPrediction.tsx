import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Loader2,
  Brain,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { fetchStudents } from '@/lib/students';
import { predict, isModelTrained, type PredictionResult } from '@/lib/ml';
import { CATEGORY_COLORS, CATEGORIES } from '@/types';
import type { PerformanceCategory } from '@/types';
import type { Student } from '@/types';

interface PredictionForm {
  attendance: number;
  assignment_score: number;
  internal_marks: number;
  previous_marks: number;
  study_hours: number;
}

const defaultForm: PredictionForm = {
  attendance: 75,
  assignment_score: 70,
  internal_marks: 70,
  previous_marks: 70,
  study_hours: 15,
};

function generateSuggestions(form: PredictionForm, category: PerformanceCategory): string[] {
  const suggestions: string[] = [];
  if (form.attendance < 75) suggestions.push('Consider improving attendance to above 75% — low attendance strongly correlates with lower marks.');
  if (form.study_hours < 15) suggestions.push('Consider increasing regular study time to at least 15-20 hours per week.');
  if (form.assignment_score < 60) suggestions.push('Focus on completing and improving assignment scores — they reinforce learning.');
  if (form.internal_marks < 60) suggestions.push('Pay attention to internal assessments — they are good indicators of final performance.');
  if (form.previous_marks < 60) suggestions.push('Review and strengthen foundational concepts from previous semesters.');
  if (suggestions.length === 0 && category === 'Excellent') suggestions.push('Excellent performance! Maintain your current study habits and attendance.');
  if (suggestions.length === 0 && category === 'Good') suggestions.push('Good performance! Consider increasing study hours slightly to reach Excellent.');
  return suggestions;
}

function generateExplanation(form: PredictionForm, category: PerformanceCategory, probabilities: { category: PerformanceCategory; probability: number }[]): string {
  const topProb = probabilities[0]?.probability ?? 0;
  const factors: string[] = [];
  if (form.attendance >= 85) factors.push('high attendance');
  else if (form.attendance < 75) factors.push('low attendance');
  if (form.study_hours >= 25) factors.push('strong study habits');
  else if (form.study_hours < 15) factors.push('limited study hours');
  if (form.assignment_score >= 80) factors.push('good assignment performance');

  const factorStr = factors.length > 0 ? ` Based on ${factors.join(', ')}.` : '';
  return `The model predicts "${category}" with ${(topProb * 100).toFixed(1)}% confidence.${factorStr} This is a prediction, not a guarantee — actual results depend on many factors.`;
}

export default function AIPrediction() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PredictionForm>(defaultForm);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setError(null);
    try {
      const res = await predict(form);
      if (!res) {
        setError('No trained model found. Please train the model first on the AI Training page.');
      } else {
        setResult(res);
      }
    } catch {
      setError('Prediction failed. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading..." />
      </Layout>
    );
  }

  const modelReady = isModelTrained();

  if (students.length < 6) {
    return (
      <Layout>
        <EmptyState
          icon={Target}
          title="Add more student records to use AI prediction"
          description={`You currently have ${students.length} student records. At least 6 are needed to train the model.`}
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

  const suggestions = result ? generateSuggestions(form, result.category) : [];
  const explanation = result ? generateExplanation(form, result.category, result.probabilities) : '';

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Performance Prediction</h1>
        <p className="text-slate-500 mt-1">Enter student data to predict their performance category</p>
      </div>

      {!modelReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-700 font-medium">No trained model found</p>
            <p className="text-sm text-amber-600 mt-1">
              Please train the model first on the{' '}
              <button onClick={() => navigate('/ai-training')} className="underline font-medium">
                AI Training page
              </button>
              .
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Input Features</h3>
          </div>
          <form onSubmit={handlePredict} className="space-y-4">
            {[
              { key: 'attendance', label: 'Attendance (%)', min: 0, max: 100, step: 0.1 },
              { key: 'assignment_score', label: 'Assignment Score', min: 0, max: 100, step: 0.1 },
              { key: 'internal_marks', label: 'Internal Marks', min: 0, max: 100, step: 0.1 },
              { key: 'previous_marks', label: 'Previous Marks', min: 0, max: 100, step: 0.1 },
              { key: 'study_hours', label: 'Study Hours/week', min: 0, max: 60, step: 0.5 },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  required
                  value={form[field.key as keyof PredictionForm]}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={predicting || !modelReady}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {predicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              Predict Performance
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!result && !error && !predicting && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Predict</h3>
              <p className="text-slate-500">Fill in the student data and click "Predict Performance" to see the AI prediction.</p>
            </div>
          )}

          {predicting && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-slate-500">Running prediction...</p>
            </div>
          )}

          {result && !predicting && (
            <>
              {/* Prediction Result */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Prediction Result</h3>
                </div>
                <div
                  className="rounded-xl p-6 text-center mb-4"
                  style={{ backgroundColor: `${CATEGORY_COLORS[result.category]}15` }}
                >
                  <p className="text-sm text-slate-500 mb-1">Predicted Performance</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: CATEGORY_COLORS[result.category] }}
                  >
                    {result.category}
                  </p>
                </div>

                {/* Probabilities */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 mb-2">Confidence by Category</p>
                  {result.probabilities.map((p) => (
                    <div key={p.category} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32 flex-shrink-0">{p.category}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
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
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{explanation}</p>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-3">Suggested Improvement Actions</h3>
                  <ul className="space-y-2">
                    {suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 text-center px-4">
                This prediction is generated by a machine learning model and is not guaranteed. Actual performance depends on many factors beyond the input features.
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
