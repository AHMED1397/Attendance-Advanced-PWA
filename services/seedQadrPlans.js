/**
 * Seed script for Qadr Plans (المقرر)
 * 
 * Run ONCE to populate Firebase with corrected qadr plan structure.
 * Path: qadrPlans/{className}/{subjectName}
 * 
 * Changes from original:
 * - All thafseer configs now include surahDetails with weight/order/ayahCount
 * - GR6 Hadees: start corrected to 3787 (continuation from GR5)
 * - GR5 Hadees: start corrected to 1245 (continuation from GR4)
 * - GR3 Hadees: finalYearEnd aligned with end (was 966, now 1568 split properly)
 * - GR4 multi-book: added examPeriod field
 * - Per-teacher progress: uses teacherProgress/{teacherId} instead of currentProgress
 * - Dummy weights (1) used for thafseer surahs — update with real page counts later
 */

import { writeUserData } from './firebase_crud.jsx';

const QADR_PLANS = {
  // ═══════════════════════════════════════════════════
  // GRADE 1 (3 sections)
  // ═══════════════════════════════════════════════════
  "الصف الأول - أ": {
    "الحديث": {
      id: "gr1a_hadees",
      book: "زاد الطالبين للامام عاشق الهي البرني",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 181,
      midYearEnd: 76,
      teacherProgress: {},
    },
  },
  "الصف الأول - ب": {
    "الحديث": {
      id: "gr1b_hadees",
      book: "زاد الطالبين للامام عاشق الهي البرني",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 181,
      midYearEnd: 76,
      teacherProgress: {},
    },
  },
  "الصف الأول - ج": {
    "الحديث": {
      id: "gr1c_hadees",
      book: "زاد الطالبين للامام عاشق الهي البرني",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 181,
      midYearEnd: 76,
      teacherProgress: {},
    },
  },

  // ═══════════════════════════════════════════════════
  // GRADE 2 (3 sections)
  // ═══════════════════════════════════════════════════
  "الصف الثاني - أ": {
    "الحديث": {
      id: "gr2a_hadees",
      book: "الاربعين النبوي",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 42,
      midYearEnd: 22,
      teacherProgress: {},
    },
  },
  "الصف الثاني - ب": {
    "الحديث": {
      id: "gr2b_hadees",
      book: "الاربعين النبوي",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 42,
      midYearEnd: 22,
      teacherProgress: {},
    },
  },
  "الصف الثاني - ج": {
    "الحديث": {
      id: "gr2c_hadees",
      book: "الاربعين النبوي",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 42,
      midYearEnd: 22,
      teacherProgress: {},
    },
  },

  // ═══════════════════════════════════════════════════
  // GRADE 3 (2 sections)
  // ═══════════════════════════════════════════════════
  "الصف الثالث - أ": {
    "الحديث": {
      id: "gr3a_hadees",
      book: "بلوغ المرام من جمع ادله الاحكام للامام ابن حجر العسقلاني",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 966,
      midYearEnd: 533,
      teacherProgress: {},
    },
    "التفسير": {
      id: "gr3a_thafseer",
      book: "تفسير الجلالين",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 37,
      midYear: {
        surahs: ["النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر"],
      },
      finalYear: {
        surahs: ["البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"],
      },
      surahDetails: {
        "النبأ":    { ayahCount: 40, weight: 1, order: 1 },
        "النازعات": { ayahCount: 46, weight: 1, order: 2 },
        "عبس":      { ayahCount: 42, weight: 1, order: 3 },
        "التكوير":  { ayahCount: 29, weight: 1, order: 4 },
        "الانفطار": { ayahCount: 19, weight: 1, order: 5 },
        "المطففين": { ayahCount: 36, weight: 1, order: 6 },
        "الانشقاق": { ayahCount: 25, weight: 1, order: 7 },
        "البروج":   { ayahCount: 22, weight: 1, order: 8 },
        "الطارق":   { ayahCount: 17, weight: 1, order: 9 },
        "الأعلى":   { ayahCount: 19, weight: 1, order: 10 },
        "الغاشية":  { ayahCount: 26, weight: 1, order: 11 },
        "الفجر":    { ayahCount: 30, weight: 1, order: 12 },
        "البلد":    { ayahCount: 20, weight: 1, order: 13 },
        "الشمس":    { ayahCount: 15, weight: 1, order: 14 },
        "الليل":    { ayahCount: 21, weight: 1, order: 15 },
        "الضحى":    { ayahCount: 11, weight: 1, order: 16 },
        "الشرح":    { ayahCount: 8,  weight: 1, order: 17 },
        "التين":    { ayahCount: 8,  weight: 1, order: 18 },
        "العلق":    { ayahCount: 19, weight: 1, order: 19 },
        "القدر":    { ayahCount: 5,  weight: 1, order: 20 },
        "البينة":   { ayahCount: 8,  weight: 1, order: 21 },
        "الزلزلة":  { ayahCount: 8,  weight: 1, order: 22 },
        "العاديات": { ayahCount: 11, weight: 1, order: 23 },
        "القارعة":  { ayahCount: 11, weight: 1, order: 24 },
        "التكاثر":  { ayahCount: 8,  weight: 1, order: 25 },
        "العصر":    { ayahCount: 3,  weight: 1, order: 26 },
        "الهمزة":  { ayahCount: 9,  weight: 1, order: 27 },
        "الفيل":    { ayahCount: 5,  weight: 1, order: 28 },
        "قريش":    { ayahCount: 4,  weight: 1, order: 29 },
        "الماعون":  { ayahCount: 7,  weight: 1, order: 30 },
        "الكوثر":  { ayahCount: 3,  weight: 1, order: 31 },
        "الكافرون": { ayahCount: 6,  weight: 1, order: 32 },
        "النصر":    { ayahCount: 3,  weight: 1, order: 33 },
        "المسد":    { ayahCount: 5,  weight: 1, order: 34 },
        "الإخلاص":  { ayahCount: 4,  weight: 1, order: 35 },
        "الفلق":    { ayahCount: 5,  weight: 1, order: 36 },
        "الناس":    { ayahCount: 6,  weight: 1, order: 37 },
      },
      teacherProgress: {},
    },
  },
  "الصف الثالث - ب": {
    "الحديث": {
      id: "gr3b_hadees",
      book: "بلوغ المرام من جمع ادله الاحكام للامام ابن حجر العسقلاني",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1,
      end: 966,
      midYearEnd: 533,
      teacherProgress: {},
    },
"التفسير": {
      id: "gr3b_thafseer",
      book: "تفسير الجلالين",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 37,
      midYear: {
        surahs: ["النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر"],
      },
      finalYear: {
        surahs: ["البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"],
      },
      surahDetails: {
        "النبأ":    { ayahCount: 40, weight: 1, order: 1 },
        "النازعات": { ayahCount: 46, weight: 1, order: 2 },
        "عبس":      { ayahCount: 42, weight: 1, order: 3 },
        "التكوير":  { ayahCount: 29, weight: 1, order: 4 },
        "الانفطار": { ayahCount: 19, weight: 1, order: 5 },
        "المطففين": { ayahCount: 36, weight: 1, order: 6 },
        "الانشقاق": { ayahCount: 25, weight: 1, order: 7 },
        "البروج":   { ayahCount: 22, weight: 1, order: 8 },
        "الطارق":   { ayahCount: 17, weight: 1, order: 9 },
        "الأعلى":   { ayahCount: 19, weight: 1, order: 10 },
        "الغاشية":  { ayahCount: 26, weight: 1, order: 11 },
        "الفجر":    { ayahCount: 30, weight: 1, order: 12 },
        "البلد":    { ayahCount: 20, weight: 1, order: 13 },
        "الشمس":    { ayahCount: 15, weight: 1, order: 14 },
        "الليل":    { ayahCount: 21, weight: 1, order: 15 },
        "الضحى":    { ayahCount: 11, weight: 1, order: 16 },
        "الشرح":    { ayahCount: 8,  weight: 1, order: 17 },
        "التين":    { ayahCount: 8,  weight: 1, order: 18 },
        "العلق":    { ayahCount: 19, weight: 1, order: 19 },
        "القدر":    { ayahCount: 5,  weight: 1, order: 20 },
        "البينة":   { ayahCount: 8,  weight: 1, order: 21 },
        "الزلزلة":  { ayahCount: 8,  weight: 1, order: 22 },
        "العاديات": { ayahCount: 11, weight: 1, order: 23 },
        "القارعة":  { ayahCount: 11, weight: 1, order: 24 },
        "التكاثر":  { ayahCount: 8,  weight: 1, order: 25 },
        "العصر":    { ayahCount: 3,  weight: 1, order: 26 },
        "الهمزة":  { ayahCount: 9,  weight: 1, order: 27 },
        "الفيل":    { ayahCount: 5,  weight: 1, order: 28 },
        "قريش":    { ayahCount: 4,  weight: 1, order: 29 },
        "الماعون":  { ayahCount: 7,  weight: 1, order: 30 },
        "الكوثر":  { ayahCount: 3,  weight: 1, order: 31 },
        "الكافرون": { ayahCount: 6,  weight: 1, order: 32 },
        "النصر":    { ayahCount: 3,  weight: 1, order: 33 },
        "المسد":    { ayahCount: 5,  weight: 1, order: 34 },
        "الإخلاص":  { ayahCount: 4,  weight: 1, order: 35 },
        "الفلق":    { ayahCount: 5,  weight: 1, order: 36 },
        "الناس":    { ayahCount: 6,  weight: 1, order: 37 },
      },
      teacherProgress: {},
    },
  },
  "الصف الرابع - أ": {
    "الحديث": {
      id: "gr4a_hadees",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      books: [
        {
          id: "gr4_bolugh",
          name: "بلوغ المرام للامام ابن حجر العسقلاني",
          start: 967,
          end: 1568,
          midYearEnd: 1568,
          examPeriod: "midYear",
        },
        {
          id: "gr4_mishka",
          name: "مشكاة المصابيح",
          start: 1,
          end: 1244,
          midYearEnd: 1244,
          examPeriod: "finalYear",
        },
      ],
      teacherProgress: {},
    },
    "التفسير": {
      id: "gr4a_thafseer",
      book: "تفسير الجلالين",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 20,
      midYear: {
        surahs: ["الأعراف","الأنفال","التوبة","يونس","هود","يوسف","إبراهيم","الحجر","النحل","الإسراء"],
      },
      finalYear: {
        surahs: ["الصافات","يس","الفاتحة","الدهر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة"],
      },
      surahDetails: {
        "الأعراف":  { ayahCount: 206, weight: 1, order: 1 },
        "الأنفال":  { ayahCount: 75,  weight: 1, order: 2 },
        "التوبة":   { ayahCount: 129, weight: 1, order: 3 },
        "يونس":     { ayahCount: 109, weight: 1, order: 4 },
        "هود":      { ayahCount: 123, weight: 1, order: 5 },
        "يوسف":     { ayahCount: 111, weight: 1, order: 6 },
        "إبراهيم":  { ayahCount: 52,  weight: 1, order: 7 },
        "الحجر":    { ayahCount: 99,  weight: 1, order: 8 },
        "النحل":    { ayahCount: 128, weight: 1, order: 9 },
        "الإسراء":  { ayahCount: 111, weight: 1, order: 10 },
        "الصافات":  { ayahCount: 182, weight: 1, order: 11 },
        "يس":       { ayahCount: 83,  weight: 1, order: 12 },
        "الفاتحة":  { ayahCount: 7,   weight: 1, order: 13 },
        "الدهر":    { ayahCount: 31,  weight: 1, order: 14 },
        "الرحمن":   { ayahCount: 78,  weight: 1, order: 15 },
        "الواقعة":  { ayahCount: 96,  weight: 1, order: 16 },
        "الحديد":   { ayahCount: 29,  weight: 1, order: 17 },
        "المجادلة": { ayahCount: 22,  weight: 1, order: 18 },
        "الحشر":    { ayahCount: 24,  weight: 1, order: 19 },
        "الممتحنة": { ayahCount: 13,  weight: 1, order: 20 },
      },
      teacherProgress: {},
    },
    "البلاغة": {
      id: "gr4a_balaqa",
      book: "دروس البلاغة",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 1,
      end: 128,
      midYearEnd: 64,
      teacherProgress: {},
    },
  },
  "الصف الرابع - ب": {
    "الحديث": {
      id: "gr4b_hadees",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      books: [
        {
          id: "gr4_bolugh",
          name: "بلوغ المرام للامام ابن حجر العسقلاني",
          start: 967,
          end: 1568,
          midYearEnd: 1568,
          examPeriod: "midYear",
        },
        {
          id: "gr4_mishka",
          name: "مشكاة المصابيح",
          start: 1,
          end: 1244,
          midYearEnd: 1244,
          examPeriod: "finalYear",
        },
      ],
      teacherProgress: {},
    },
    "التفسير": {
      id: "gr4b_thafseer",
      book: "تفسير الجلالين",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 20,
      midYear: {
        surahs: ["الأعراف","الأنفال","التوبة","يونس","هود","يوسف","إبراهيم","الحجر","النحل","الإسراء"],
      },
      finalYear: {
        surahs: ["الصافات","يس","الفاتحة","الدهر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة"],
      },
      surahDetails: {
        "الأعراف":  { ayahCount: 206, weight: 1, order: 1 },
        "الأنفال":  { ayahCount: 75,  weight: 1, order: 2 },
        "التوبة":   { ayahCount: 129, weight: 1, order: 3 },
        "يونس":     { ayahCount: 109, weight: 1, order: 4 },
        "هود":      { ayahCount: 123, weight: 1, order: 5 },
        "يوسف":     { ayahCount: 111, weight: 1, order: 6 },
        "إبراهيم":  { ayahCount: 52,  weight: 1, order: 7 },
        "الحجر":    { ayahCount: 99,  weight: 1, order: 8 },
        "النحل":    { ayahCount: 128, weight: 1, order: 9 },
        "الإسراء":  { ayahCount: 111, weight: 1, order: 10 },
        "الصافات":  { ayahCount: 182, weight: 1, order: 11 },
        "يس":       { ayahCount: 83,  weight: 1, order: 12 },
        "الفاتحة":  { ayahCount: 7,   weight: 1, order: 13 },
        "الدهر":    { ayahCount: 31,  weight: 1, order: 14 },
        "الرحمن":   { ayahCount: 78,  weight: 1, order: 15 },
        "الواقعة":  { ayahCount: 96,  weight: 1, order: 16 },
        "الحديد":   { ayahCount: 29,  weight: 1, order: 17 },
        "المجادلة": { ayahCount: 22,  weight: 1, order: 18 },
        "الحشر":    { ayahCount: 24,  weight: 1, order: 19 },
        "الممتحنة": { ayahCount: 13,  weight: 1, order: 20 },
      },
      teacherProgress: {},
    },
    "البلاغة": {
      id: "gr4b_balaqa",
      book: "دروس البلاغة",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 1,
      end: 128,
      midYearEnd: 64,
      teacherProgress: {},
    },
  },

  // ═══════════════════════════════════════════════════
  // GRADE 5
  // ═══════════════════════════════════════════════════
  "الصف الخامس": {
    "الحديث": {
      id: "gr5_hadees",
      book: "مشكاة المصابيح",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 1245,
      end: 3786,
      midYearEnd: 2504,
      teacherProgress: {},
    },
    "التفسير": {
      id: "gr5_thafseer",
      book: "مختصر تفسير القرطبي",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 5,
      midYear: {
        surahs: ["التوبة","يوسف"],
      },
      finalYear: {
        surahs: ["الإسراء","الكهف","مريم"],
      },
      surahDetails: {
        "التوبة":   { ayahCount: 129, weight: 1, order: 1 },
        "يوسف":    { ayahCount: 111, weight: 1, order: 2 },
        "الإسراء":  { ayahCount: 111, weight: 1, order: 3 },
        "الكهف":   { ayahCount: 110, weight: 1, order: 4 },
        "مريم":    { ayahCount: 98,  weight: 1, order: 5 },
      },
      teacherProgress: {},
    },
    "البلاغة": {
      id: "gr5_balaqa",
      book: "البلاغة الواضحة",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 1,
      end: 127,
      midYearEnd: 63,
      teacherProgress: {},
    },
    "المنطق": {
      id: "gr5_mantiq",
      book: "تسهيل المنطق",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 1,
      end: 124,
      midYearEnd: 59,
      teacherProgress: {},
    },
  },

  // ═══════════════════════════════════════════════════
  // GRADE 6
  // ═══════════════════════════════════════════════════
  "الصف السادس": {
    "الحديث": {
      id: "gr6_hadees",
      book: "مشكاة المصابيح",
      unitLabel: "حديث",
      unitLabelEn: "Hadees",
      start: 3787,
      end: 6294,
      midYearEnd: 5002,
      teacherProgress: {},
    },
    "التفسير": {
      id: "gr6_thafseer",
      book: "مختصر ابن كثير",
      unitLabel: "سورة",
      unitLabelEn: "Surah",
      totalSurahs: 9,
      midYear: {
        surahs: ["المؤمنون","النور","الأحزاب"],
      },
      finalYear: {
        surahs: ["التغابن","الفتح","الحجرات","الممتحنة","الصف","الطلاق"],
      },
      surahDetails: {
        "المؤمنون": { ayahCount: 118, weight: 1, order: 1 },
        "النور":    { ayahCount: 64,  weight: 1, order: 2 },
        "الأحزاب":  { ayahCount: 73,  weight: 1, order: 3 },
        "التغابن":  { ayahCount: 18,  weight: 1, order: 4 },
        "الفتح":    { ayahCount: 29,  weight: 1, order: 5 },
        "الحجرات":  { ayahCount: 18,  weight: 1, order: 6 },
        "الممتحنة": { ayahCount: 13,  weight: 1, order: 7 },
        "الصف":     { ayahCount: 14,  weight: 1, order: 8 },
        "الطلاق":   { ayahCount: 12,  weight: 1, order: 9 },
      },
      teacherProgress: {},
    },
    "البلاغة": {
      id: "gr6_balaqa",
      book: "البلاغة الواضحة",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 128,
      end: 273,
      midYearEnd: 200,
      teacherProgress: {},
    },
    "النحو": {
      id: "gr6_nahu",
      book: "الشرح الميسر لالفيه ابن مالك",
      unitLabel: "بيت",
      unitLabelEn: "Beit",
      start: 1,
      end: 500,
      midYearEnd: 250,
      teacherProgress: {},
    },
    "أصول التخريج": {
      id: "gr6_takhrij",
      book: "أصول التخريج ودراسة الاسانيد",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 3,
      end: 131,
      midYearEnd: 94,
      teacherProgress: {},
    },
    "أصول الفقه": {
      id: "gr6_usul",
      book: "الوجيز في أصول الفقه",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 86,
      end: 162,
      midYearEnd: 128,
      teacherProgress: {},
    },
    "أصول التفسير": {
      id: "gr6_tafsir_usul",
      book: "الميسر في علوم القران",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 216,
      end: 500,
      midYearEnd: 284,
      teacherProgress: {},
    },
    "الأدب": {
      id: "gr6_adab",
      book: "الأدب العربي",
      unitLabel: "صفحة",
      unitLabelEn: "Page",
      start: 8,
      end: 87,
      midYearEnd: 51,
      teacherProgress: {},
    },
  },
};

/**
 * Seed qadr plans to Firebase — writes one subject at a time to avoid timeout.
 */
export const seedQadrPlans = async () => {
  try {
    const classNames = Object.keys(QADR_PLANS);
    let count = 0;
    const total = classNames.reduce((sum, cls) => sum + Object.keys(QADR_PLANS[cls]).length, 0);

    for (const cls of classNames) {
      const subjects = QADR_PLANS[cls];
      for (const subj of Object.keys(subjects)) {
        count++;
        console.log(`⏳ Seeding ${count}/${total}: ${cls} / ${subj}`);
        await writeUserData(`qadrPlans/${cls}/${subj}`, subjects[subj]);
      }
    }
    console.log('✅ Qadr plans seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to seed qadr plans:', error);
    return false;
  }
};

export default QADR_PLANS;
