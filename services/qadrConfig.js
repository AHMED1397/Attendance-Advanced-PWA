/**
 * Qadr (المقرر) Configuration — Firebase-Controlled
 * 
 * Fetches qadr plan data from Firebase instead of using hardcoded configs.
 * The plans are managed by the superior via a separate admin app.
 * 
 * Firebase path: qadrPlans/{className}/{subjectName}
 */

import { readUserData } from './firebase_crud.jsx';

// Local cache to avoid re-fetching during a session
let qadrCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all qadr plans from Firebase (with caching).
 */
const fetchAllQadrPlans = async () => {
  const now = Date.now();
  if (qadrCache && (now - lastFetchTime) < CACHE_DURATION) {
    return qadrCache;
  }

  try {
    const plans = await readUserData('qadrPlans');
    if (plans) {
      qadrCache = plans;
      lastFetchTime = now;
    }
    return plans || null;
  } catch (error) {
    console.error('Error fetching qadr plans:', error);
    return qadrCache || null; // Return stale cache if available
  }
};

/**
 * Clear the local cache (useful when you know data has changed).
 */
export const clearQadrCache = () => {
  qadrCache = null;
  lastFetchTime = 0;
};

/**
 * Find a matching qadr config for the given class and subject.
 * Fetches from Firebase. Returns the config object if found, or null.
 */
export const fetchQadrConfig = async (className, subject) => {
  if (!className || !subject) return null;

  const plans = await fetchAllQadrPlans();
  if (!plans) return null;

  // Find matching class — try exact match first, then partial match
  let classPlans = plans[className];
  if (!classPlans) {
    const classKeys = Object.keys(plans);
    for (const key of classKeys) {
      if (className.includes(key) || key.includes(className)) {
        classPlans = plans[key];
        break;
      }
    }
  }
  if (!classPlans) return null;

  // Find matching subject — try exact match first
  let config = classPlans[subject];
  
  // Then try partial match
  if (!config) {
    const subjectKeys = Object.keys(classPlans);
    for (const key of subjectKeys) {
      // Check if subject name contains the key or vice versa
      if (subject.includes(key) || key.includes(subject)) {
        config = classPlans[key];
        break;
      }
      // Also check the stored config's type for keyword matching
      const plan = classPlans[key];
      if (plan.type === 'hadees' && /حديث|الحديث|hadees|hadith/i.test(subject)) {
        config = plan;
        break;
      }
      if (plan.type === 'thafseer' && /تفسير|التفسير|thafseer|tafseer|tafsir/i.test(subject)) {
        config = plan;
        break;
      }
    }
  }

  // Store the matched className for Firebase write-back path
  if (config) {
    config._className = className;
    config._subjectKey = subject;
  }

  return config || null;
};

/**
 * Calculate progress for hadees-type qadr.
 * Returns both whole-year and current-exam progress.
 */
export const calculateHadeesProgress = (config) => {
  const currentNumber = config.currentProgress || config.start;
  const totalRange = config.end - config.start;
  const clamped = Math.max(config.start, Math.min(config.end, currentNumber));

  // Whole year progress
  const completed = clamped - config.start;
  const wholeYearPercentage = totalRange > 0 ? (completed / totalRange) * 100 : 0;

  // Mid-year marker position on whole year bar
  const midRange = (config.midYearEnd || config.start + Math.floor(totalRange / 2)) - config.start;
  const midPercentage = totalRange > 0 ? (midRange / totalRange) * 100 : 50;

  // Current exam progress
  const isPastMid = clamped > (config.midYearEnd || config.start + Math.floor(totalRange / 2));
  let examStart, examEnd, examLabel;
  if (isPastMid) {
    examStart = config.finalYearStart || config.midYearEnd + 1;
    examEnd = config.finalYearEnd || config.end;
    examLabel = 'النهائي';
  } else {
    examStart = config.midYearStart || config.start;
    examEnd = config.midYearEnd || config.start + Math.floor(totalRange / 2);
    examLabel = 'النصفي';
  }
  const examRange = examEnd - examStart;
  const examCompleted = Math.max(0, Math.min(examRange, clamped - examStart));
  const examPercentage = examRange > 0 ? (examCompleted / examRange) * 100 : 0;

  return {
    currentNumber: clamped,
    // Whole year
    totalRange,
    completed,
    remaining: config.end - clamped,
    wholeYearPercentage: Math.min(100, Math.max(0, wholeYearPercentage)),
    midPercentage,
    // Current exam
    examStart,
    examEnd,
    examRange,
    examCompleted,
    examPercentage: Math.min(100, Math.max(0, examPercentage)),
    examLabel,
    isPastMid,
    isComplete: clamped >= config.end,
  };
};

/**
 * Calculate progress for thafseer-type qadr.
 * Returns both whole-year and current-exam progress.
 */
export const calculateThafseerProgress = (config) => {
  const progress = config.currentProgress || {};
  const surahDetails = config.surahDetails || {};
  const allSurahs = Object.keys(surahDetails).sort((a, b) =>
    (surahDetails[a].order || 0) - (surahDetails[b].order || 0)
  );

  const totalAyahs = allSurahs.reduce((sum, s) => sum + (surahDetails[s]?.ayahCount || 0), 0);
  const totalPages = allSurahs.reduce((sum, s) => sum + (surahDetails[s]?.weight || 0), 0);
  const completedSurahs = progress.completedSurahs || [];

  // Calculate completed ayahs and pages
  let completedAyahs = 0;
  let completedPages = 0;
  for (const surah of completedSurahs) {
    completedAyahs += surahDetails[surah]?.ayahCount || 0;
    completedPages += surahDetails[surah]?.weight || 0;
  }
  if (progress.currentSurah && progress.currentAyah > 0) {
    completedAyahs += progress.currentAyah;
    const currentSurahAyahs = surahDetails[progress.currentSurah]?.ayahCount || 1;
    const currentSurahWeight = surahDetails[progress.currentSurah]?.weight || 0;
    const ayahRatio = progress.currentAyah / currentSurahAyahs;
    completedPages += (ayahRatio * currentSurahWeight);
  }

  const wholeYearPercentage = totalPages > 0 ? (completedPages / totalPages) * 100 : 0;

  // Mid-year boundary
  const midYearSurahs = config.midYear?.surahs || [];
  const finalYearSurahs = config.finalYear?.surahs || [];
  const midYearPages = midYearSurahs.reduce((sum, s) => sum + (surahDetails[s]?.weight || 0), 0);
  const midPercentage = totalPages > 0 ? (midYearPages / totalPages) * 100 : 50;
  const midYearComplete = midYearSurahs.length > 0 && midYearSurahs.every(s => completedSurahs.includes(s));

  // Current exam progress
  let examSurahs, examLabel;
  if (midYearComplete) {
    examSurahs = finalYearSurahs;
    examLabel = 'النهائي';
  } else {
    examSurahs = midYearSurahs;
    examLabel = 'النصفي';
  }
  const examTotalPages = examSurahs.reduce((sum, s) => sum + (surahDetails[s]?.weight || 0), 0);
  let examCompletedPages = 0;
  for (const surah of examSurahs) {
    if (completedSurahs.includes(surah)) {
      examCompletedPages += surahDetails[surah]?.weight || 0;
    } else if (progress.currentSurah === surah && progress.currentAyah > 0) {
      const currentSurahAyahs = surahDetails[surah]?.ayahCount || 1;
      const currentSurahWeight = surahDetails[surah]?.weight || 0;
      const ayahRatio = progress.currentAyah / currentSurahAyahs;
      examCompletedPages += (ayahRatio * currentSurahWeight);
    }
  }
  const examPercentage = examTotalPages > 0 ? (examCompletedPages / examTotalPages) * 100 : 0;

  return {
    allSurahs,
    totalAyahs,
    completedAyahs,
    totalPages,
    completedPages,
    completedSurahs,
    currentSurah: progress.currentSurah || null,
    currentAyah: progress.currentAyah || 0,
    // Whole year
    wholeYearPercentage: Math.min(100, Math.max(0, wholeYearPercentage)),
    midPercentage,
    midYearSurahs,
    finalYearSurahs,
    // Current exam
    examSurahs,
    examTotalPages,
    examCompletedPages,
    examPercentage: Math.min(100, Math.max(0, examPercentage)),
    examLabel,
    isMidYearComplete: midYearComplete,
    isComplete: completedAyahs >= totalAyahs,
  };
};

/**
 * Generic progress calculator — dispatches based on type.
 */
export const calculateQadrProgress = (config) => {
  if (config.type === 'thafseer') {
    return calculateThafseerProgress(config);
  }
  return calculateHadeesProgress(config);
};
