import * as tf from '@tensorflow/tfjs';
import type { Student, PerformanceCategory } from '@/types';
import { CATEGORIES, getCategoryFromMarks } from '@/types';

export interface TrainingResult {
  trainSamples: number;
  testSamples: number;
  accuracy: number;
  confusionMatrix: number[][];
  perClassAccuracy: { category: PerformanceCategory; correct: number; total: number; accuracy: number }[];
  epochs: number;
  history: { loss: number[]; acc: number[] };
}

export interface PredictionResult {
  category: PerformanceCategory;
  probabilities: { category: PerformanceCategory; probability: number }[];
}

const FEATURE_KEYS: (keyof Student)[] = ['attendance', 'assignment_score', 'internal_marks', 'previous_marks', 'study_hours'];

const PREDICTION_KEYS: ('attendance' | 'assignment_score' | 'internal_marks' | 'previous_marks' | 'study_hours')[] = ['attendance', 'assignment_score', 'internal_marks', 'previous_marks', 'study_hours'];

function normalize(value: number, max: number): number {
  return max > 0 ? value / max : 0;
}

const MAX_VALUES: Record<string, number> = {
  attendance: 100,
  assignment_score: 100,
  internal_marks: 100,
  previous_marks: 100,
  study_hours: 50,
};

export function featuresToTensor(students: Student[]): tf.Tensor2D {
  return tf.tensor2d(
    students.map((s) =>
      FEATURE_KEYS.map((k) => normalize(Number(s[k] ?? 0), MAX_VALUES[k]))
    )
  );
}

function labelsToTensor(students: Student[]): tf.Tensor2D {
  return tf.tensor2d(
    students.map((s) => {
      const cat = getCategoryFromMarks(Number(s.final_marks ?? 0));
      return CATEGORIES.map((c) => (c === cat ? 1 : 0));
    })
  );
}

export function inputToTensor(input: {
  attendance: number;
  assignment_score: number;
  internal_marks: number;
  previous_marks: number;
  study_hours: number;
}): tf.Tensor2D {
  return tf.tensor2d([
    FEATURE_KEYS.map((k) => normalize(Number(input[k] ?? 0), MAX_VALUES[k])),
  ]);
}

let model: tf.LayersModel | null = null;

export function isModelTrained(): boolean {
  return model !== null;
}

export function getModel(): tf.LayersModel | null {
  return model;
}

export function clearModel(): void {
  if (model) {
    model.dispose();
    model = null;
  }
}

export async function trainModel(students: Student[], epochs = 100): Promise<TrainingResult> {
  if (students.length < 6) {
    throw new Error('Add more student records to train the model.');
  }

  clearModel();
  await tf.ready();

  // Shuffle and split 80/20
  const shuffled = [...students].sort(() => Math.random() - 0.5);
  const splitIdx = Math.max(1, Math.floor(shuffled.length * 0.8));
  const trainData = shuffled.slice(0, splitIdx);
  const testData = shuffled.slice(splitIdx);

  const trainX = featuresToTensor(trainData);
  const trainY = labelsToTensor(trainData);
  const testX = featuresToTensor(testData);
  const testY = labelsToTensor(testData);

  const m = tf.sequential();
  m.add(
    tf.layers.dense({
      inputShape: [FEATURE_KEYS.length],
      units: 32,
      activation: 'relu',
    })
  );
  m.add(tf.layers.dropout({ rate: 0.15 }));
  m.add(
    tf.layers.dense({
      units: 16,
      activation: 'relu',
    })
  );
  m.add(
    tf.layers.dense({
      units: CATEGORIES.length,
      activation: 'softmax',
    })
  );

  m.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  const history = await m.fit(trainX, trainY, {
    epochs,
    batchSize: Math.min(16, trainData.length),
    shuffle: true,
    validationData: [testX, testY],
    verbose: 0,
  });

  model = m;

  // Evaluate on test data
  const testPred = m.predict(testX) as tf.Tensor;
  const testPredArr = (await testPred.array()) as number[][];
  const testYArr = (await testY.array()) as number[][];

  const confusionMatrix: number[][] = CATEGORIES.map(() => CATEGORIES.map(() => 0));
  let correct = 0;

  for (let i = 0; i < testPredArr.length; i++) {
    const pred = testPredArr[i].indexOf(Math.max(...testPredArr[i]));
    const actual = testYArr[i].indexOf(Math.max(...testYArr[i]));
    confusionMatrix[actual][pred]++;
    if (pred === actual) correct++;
  }

  const accuracy = testData.length > 0 ? correct / testData.length : 0;

  const perClassAccuracy = CATEGORIES.map((category, idx) => {
    const total = confusionMatrix[idx].reduce((a, b) => a + b, 0);
    const classCorrect = confusionMatrix[idx][idx];
    return {
      category,
      correct: classCorrect,
      total,
      accuracy: total > 0 ? classCorrect / total : 0,
    };
  });

  testX.dispose();
  testY.dispose();
  testPred.dispose();
  trainX.dispose();
  trainY.dispose();

  return {
    trainSamples: trainData.length,
    testSamples: testData.length,
    accuracy,
    confusionMatrix,
    perClassAccuracy,
    epochs,
    history: {
      loss: history.history.loss as number[],
      acc: history.history.acc as number[],
    },
  };
}

export async function predict(input: {
  attendance: number;
  assignment_score: number;
  internal_marks: number;
  previous_marks: number;
  study_hours: number;
}): Promise<PredictionResult | null> {
  if (!model) return null;
  await tf.ready();
  const x = inputToTensor(input);
  const pred = model.predict(x) as tf.Tensor;
  const arr = (await pred.array()) as number[][];
  const arr0 = arr[0];

  x.dispose();
  pred.dispose();

  const probs = CATEGORIES.map((category, i) => ({
    category,
    probability: arr[i],
  })).sort((a, b) => b.probability - a.probability);

  return {
    category: probs[0].category,
    probabilities: probs,
  };
}
