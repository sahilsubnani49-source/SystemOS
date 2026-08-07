export interface NutritionResult {
  dailyProteinG: number;
  rangeMinG: number;
  rangeMaxG: number;
  bmi: number | null;
  bmiCategory: string | null;
  rationale: string;
  tip: string;
  aiGenerated: boolean;
  computedAt: string;
}

/**
 * Today's protein recommendation in grams, or null when weightKg is invalid.
 * Canonical formula (mirrored in the Architect's nutrition prompt):
 *   bmi = weightKg / (heightCm / 100)^2   (only when heightCm is provided)
 *   base g/kg by BMI band:  <18.5 -> 2.0,  <25 -> 1.8,  <30 -> 1.6,  else 1.4
 *   when heightCm is missing/invalid, assume base = 1.8 (no BMI available)
 *   bonus = 0.2 * (exercisesCompletedToday / max(1, totalExercises)), capped at 0.2
 */
export function computeProteinTarget(
  weightKg: number,
  exercisesCompletedToday: number,
  totalExercises: number,
  heightCm?: number | null,
): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;

  const hasHeight = heightCm != null && Number.isFinite(heightCm) && heightCm > 0;
  const bmi = hasHeight ? weightKg / Math.pow(heightCm / 100, 2) : null;

  let base: number;
  if (bmi == null) base = 1.8;
  else if (bmi < 18.5) base = 2.0;
  else if (bmi < 25) base = 1.8;
  else if (bmi < 30) base = 1.6;
  else base = 1.4;

  const done = Math.max(0, exercisesCompletedToday);
  const bonus = 0.2 * Math.min(1, done / Math.max(1, totalExercises));

  return Math.round(weightKg * (base + bonus));
}

/** Round to one decimal place. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** BMI band label matching computeProteinTarget's bands; null without height. */
function bmiCategoryFor(bmi: number | null): string | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Offline fallback for the nutrition directive — used when the device is offline
 * or the backend Architect call fails. Delegates the gram figure to
 * computeProteinTarget so both paths share the one canonical formula.
 * Returns null only when the inputs are invalid (e.g. no usable weight), letting
 * the UI surface a "calibration pending" state instead of a bogus number.
 */
export function computeLocalNutrition(
  weightKg: number,
  heightCm: number | null,
  doneToday: number,
  total: number,
): NutritionResult | null {
  const grams = computeProteinTarget(weightKg, doneToday, total, heightCm);
  if (grams == null) return null;

  const bmi = heightCm ? round1(weightKg / Math.pow(heightCm / 100, 2)) : null;

  return {
    dailyProteinG: grams,
    rangeMinG: Math.round(grams * 0.9),
    rangeMaxG: Math.round(grams * 1.1),
    bmi,
    bmiCategory: bmiCategoryFor(bmi),
    rationale: 'Local calibration — the Architect is offline.',
    tip: 'Spread protein across 3–4 meals for steady synthesis.',
    aiGenerated: false,
    computedAt: new Date().toISOString(),
  };
}
