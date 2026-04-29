/**
 * Seed script for Qadr Plans (المقرر)
 * 
 * Run this ONCE to populate the Firebase Realtime Database with the initial
 * qadr plan structure. After running, the data will be at:
 *   qadrPlans/{className}/{subjectName}
 * 
 * This data will be controlled by the superior via a separate admin app.
 */

import { writeUserData } from './firebase_crud.jsx';

const QADR_PLANS = {
  "الصف السادس": {
    "الحديث": {
      id: "gr6_hadees",
      type: "hadees",
      book: "مشكاة المصابيح",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 3787,
      end: 6294,
      midYearStart: 3787,
      midYearEnd: 5062,
      finalYearStart: 5063,
      finalYearEnd: 6294,
      currentProgress: 4454,
    },
    "التفسير": {
      id: "gr6_thafseer",
      type: "thafseer",
      book: "مختصر ابن كثير",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 9,
      midYear: {
        surahs: ["المؤمنون", "النور", "الأحزاب"],
        totalAyahs: 255,
      },
      finalYear: {
        surahs: ["التغابن", "الفتح", "الحجرات", "الممتحنة", "الصف", "الطلاق"],
        totalAyahs: 104,
      },
      surahDetails: {
        "المؤمنون": { ayahCount: 118, order: 1 },
        "النور": { ayahCount: 64, order: 2 },
        "الأحزاب": { ayahCount: 73, order: 3 },
        "التغابن": { ayahCount: 18, order: 4 },
        "الفتح": { ayahCount: 29, order: 5 },
        "الحجرات": { ayahCount: 18, order: 6 },
        "الممتحنة": { ayahCount: 13, order: 7 },
        "الصف": { ayahCount: 14, order: 8 },
        "الطلاق": { ayahCount: 12, order: 9 },
      },
      currentProgress: {
        completedSurahs: [],
        currentSurah: null,
        currentAyah: 0,
      },
    },
  },
};

/**
 * Call this function once to seed the qadrPlans data into Firebase.
 * Can be triggered from a button in the app or run in a useEffect.
 */
export const seedQadrPlans = async () => {
  try {
    await writeUserData('qadrPlans', QADR_PLANS);
    console.log('✅ Qadr plans seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to seed qadr plans:', error);
    return false;
  }
};

export default QADR_PLANS;
