import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getData, syncPrayerFromFB } from '../services/asyncStorage';
import DatePickerCross from '../components/DatePickerCross';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'thahajjud', 'luha'];
const PRAYER_COLORS = {
  fajr: '#F59E0B',
  dhuhr: '#EF4444',
  asr: '#F97316',
  maghrib: '#8B5CF6',
  isha: '#3B82F6',
  thahajjud: '#6366F1',
  luha: '#059669',
};
const PRAYER_ICONS = {
  fajr: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'cloudy-night-outline',
  isha: 'moon-outline',
  thahajjud: 'weather-night',
  luha: 'mosque',
};
const MATERIAL_ICONS = ['thahajjud', 'luha'];

const PrayerAnalytics = () => {
  const params = useLocalSearchParams();
  const { className: initialClass } = params;
  const router = useRouter();
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [prayerData, setPrayerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // First try to sync from Firebase
    const syncedData = await syncPrayerFromFB();
    if (syncedData) {
      setPrayerData(syncedData);
    } else {
      // Fall back to local storage
      const data = await getData('prayerDetails');
      if (data) setPrayerData(data);
    }
    const init = await getData('initialData');
    if (init) setInitialData(init);
  };

  useEffect(() => {
    filterData();
  }, [prayerData, fromDate, toDate]);

  const filterData = () => {
    const from = new Date(fromDate.toDateString());
    const to = new Date(toDate.toDateString());
    
    // Robust normalization to handle Arabic spacing/dash differences
    const normalize = (s) => s?.replace(/\s+/g, '').replace(/-/g, '').replace(/[\u064B-\u065F]/g, '');

    const filtered = prayerData.filter((record) => {
      if (initialClass) {
        if (record.Class !== initialClass && normalize(record.Class) !== normalize(initialClass)) {
          return false;
        }
      }
      const recordDate = new Date(record.Date);
      return recordDate >= from && recordDate <= to;
    });
    setFilteredData(filtered);
  };

  // Compute per-prayer stats
  // Each record now has: { Prayer: 'fajr', Attendance: { rollNo: true/false } }
  const prayerStats = {};
  PRAYERS.forEach((p) => {
    prayerStats[p] = { present: 0, total: 0 };
  });

  filteredData.forEach((record) => {
    const prayer = record.Prayer;
    if (prayer && record.Attendance) {
      const entries = Object.values(record.Attendance);
      prayerStats[prayer].total += entries.length;
      prayerStats[prayer].present += entries.filter(Boolean).length;
    }
  });

  const prayerPercentages = {};
  PRAYERS.forEach((p) => {
    prayerPercentages[p] = prayerStats[p].total > 0
      ? ((prayerStats[p].present / prayerStats[p].total) * 100).toFixed(0)
      : 0;
  });

  const totalPresent = PRAYERS.reduce((s, p) => s + prayerStats[p].present, 0);
  const totalEntries = PRAYERS.reduce((s, p) => s + prayerStats[p].total, 0);
  const overallAvg = totalEntries > 0 ? ((totalPresent / totalEntries) * 100).toFixed(0) : 0;

  // Student rankings — aggregate across all prayer records
  const studentStats = {};
  const studentNames = initialData?.students?.[initialClass] || {};

  filteredData.forEach((record) => {
    if (record.Attendance) {
      Object.entries(record.Attendance).forEach(([rollNo, prayed]) => {
        if (!studentStats[rollNo]) {
          studentStats[rollNo] = { total: 0, prayed: 0 };
        }
        studentStats[rollNo].total += 1;
        if (prayed) studentStats[rollNo].prayed += 1;
      });
    }
  });

  const rankings = Object.entries(studentStats)
    .map(([rollNo, stats]) => ({
      rollNo,
      name: studentNames[rollNo] || rollNo,
      percentage: stats.total > 0 ? ((stats.prayed / stats.total) * 100).toFixed(0) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const topStudents = rankings.filter((s) => Number(s.percentage) >= 60);
  const atRiskStudents = rankings.filter((s) => Number(s.percentage) < 60);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const formatDate = (d) => `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(600).springify()}
        style={{ backgroundColor: primaryColor }}
        className="rounded-b-[32px] px-5 pt-14 pb-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text className="text-white/70 text-sm ml-2">{t('back', language)}</Text>
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">{t('prayerAnalytics', language)}</Text>
          <TouchableOpacity 
            onPress={loadData}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="sync" size={18} color="white" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-2">{initialClass}</Text>
          <View className="w-1 h-1 bg-white/40 rounded-full mx-3" />
          <Text className="text-white/70 text-sm">{filteredData.length} {t('totalRecordsLabel', language)}</Text>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Date Range Selector */}
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-6">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('selectDateRange', language)}</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              className="flex-1 bg-surface rounded-2xl p-3 flex-row items-center border border-slate-50"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <Ionicons name="calendar-outline" size={16} color={primaryColor} />
              <View className="ml-2 flex-1">
                <Text className="text-text-sub text-[10px] uppercase">{t('from', language)}</Text>
                <Text className="text-text-main text-xs font-semibold">{formatDate(fromDate)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              className="flex-1 bg-surface rounded-2xl p-3 flex-row items-center border border-slate-50"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <Ionicons name="calendar-outline" size={16} color={primaryColor} />
              <View className="ml-2 flex-1">
                <Text className="text-text-sub text-[10px] uppercase">{t('to', language)}</Text>
                <Text className="text-text-main text-xs font-semibold">{formatDate(toDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>
          {showFromPicker && (
            <DatePickerCross mode="date" value={fromDate} display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(e, d) => { if (d) setFromDate(d); setShowFromPicker(false); }} isDark={isDark} />
          )}
          {showToPicker && (
            <DatePickerCross mode="date" value={toDate} display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(e, d) => { if (d) setToDate(d); setShowToPicker(false); }} isDark={isDark} />
          )}
        </Animated.View>

        {/* Overall Stats */}
        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="flex-row px-5 mt-5 gap-3">
          <View className="flex-1 bg-surface rounded-2xl p-4 items-center border border-slate-50"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
            <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: `${primaryColor}15` }}>
              <Ionicons name="bar-chart" size={18} color={primaryColor} />
            </View>
            <Text className="text-2xl font-bold text-text-main">{overallAvg}%</Text>
            <Text className="text-text-sub text-[10px] uppercase font-medium tracking-wider mt-0.5">{t('avgCompletion', language)}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-2xl p-4 items-center border border-slate-50"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
            <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: '#10B98115' }}>
              <Ionicons name="people" size={18} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-text-main">{rankings.length}</Text>
            <Text className="text-text-sub text-[10px] uppercase font-medium tracking-wider mt-0.5">{t('total', language)}</Text>
          </View>
        </Animated.View>

        {/* Prayer Breakdown */}
        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-6">
          <Text className="text-text-main text-base font-bold mb-3">{t('prayerBreakdown', language)}</Text>
          <View className="bg-surface rounded-2xl p-4 border border-slate-50"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
            {PRAYERS.map((prayer, idx) => {
              const pct = Number(prayerPercentages[prayer]);
              const recordCount = filteredData.filter(r => r.Prayer === prayer).length;
              return (
                <View key={prayer} className={`flex-row items-center ${idx < PRAYERS.length - 1 ? 'mb-4' : ''}`}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${PRAYER_COLORS[prayer]}15` }}>
                    {MATERIAL_ICONS.includes(prayer)
                      ? <MaterialCommunityIcons name={PRAYER_ICONS[prayer]} size={16} color={PRAYER_COLORS[prayer]} />
                      : <Ionicons name={PRAYER_ICONS[prayer]} size={16} color={PRAYER_COLORS[prayer]} />
                    }
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center">
                        <Text className="text-text-main text-sm font-semibold">{t(prayer, language)}</Text>
                        <Text className="text-text-sub text-[10px] ml-2">({recordCount} {t('totalRecordsLabel', language)})</Text>
                      </View>
                      <Text className="text-text-sub text-xs font-bold">{pct}%</Text>
                    </View>
                    <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <View 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${pct}%`, 
                          backgroundColor: PRAYER_COLORS[prayer],
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Top Performers */}
        {topStudents.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} className="px-5 mt-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="trophy" size={16} color="#F59E0B" />
              <Text className="text-text-main text-base font-bold ml-2">{t('topPerformers', language)}</Text>
            </View>
            <View className="bg-surface rounded-2xl border border-slate-50 overflow-hidden"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
              {topStudents.slice(0, 10).map((student, idx) => (
                <View key={student.rollNo} 
                      className={`flex-row items-center px-4 py-3 ${idx < Math.min(topStudents.length, 10) - 1 ? 'border-b border-slate-50' : ''}`}>
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: idx < 3 ? '#FEF3C7' : `${primaryColor}10` }}>
                    <Text className="text-xs font-bold" style={{ color: idx < 3 ? '#D97706' : primaryColor }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-main text-sm font-semibold" numberOfLines={1}>{student.name}</Text>
                    <Text className="text-text-sub text-[10px]">{student.rollNo}</Text>
                  </View>
                  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#ECFDF5' }}>
                    <Text className="text-xs font-bold" style={{ color: '#059669' }}>{student.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* At-Risk Students */}
        {atRiskStudents.length > 0 && (
          <Animated.View entering={FadeInUp.delay(500).duration(600).springify()} className="px-5 mt-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text className="text-text-main text-base font-bold ml-2">{t('atRiskStudents', language)}</Text>
            </View>
            <View className="bg-surface rounded-2xl border border-slate-50 overflow-hidden"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
              {atRiskStudents.map((student, idx) => (
                <View key={student.rollNo} 
                      className={`flex-row items-center px-4 py-3 ${idx < atRiskStudents.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: '#FEF2F2' }}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-main text-sm font-semibold" numberOfLines={1}>{student.name}</Text>
                    <Text className="text-text-sub text-[10px]">{t('belowThreshold', language)}</Text>
                  </View>
                  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
                    <Text className="text-xs font-bold" style={{ color: '#DC2626' }}>{student.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {filteredData.length === 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-10">
            <View className="bg-surface rounded-2xl p-8 items-center border border-slate-50">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${primaryColor}10` }}>
                <Ionicons name="moon-outline" size={28} color={primaryColor} />
              </View>
              <Text className="text-text-main font-semibold">{t('noPrayerData', language)}</Text>
              <Text className="text-text-sub text-xs text-center mt-1">{t('startMarkingPrayers', language)}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

export default PrayerAnalytics;
