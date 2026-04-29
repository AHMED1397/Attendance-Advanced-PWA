import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { getData } from '../services/asyncStorage';
import { readUserData } from '../services/firebase_crud';
import { useRouter } from 'expo-router';
import { useSettings } from '../services/SettingsContext';
import NetInfo from '@react-native-community/netinfo';

const ProgressBar = ({ label, percentage, color }) => (
  <View className="mb-3">
    <View className="flex-row justify-between mb-1">
      <Text className="text-text-main text-xs font-medium" numberOfLines={1} style={{ maxWidth: '60%' }}>{label}</Text>
      <Text className="text-xs font-bold" style={{ color }}>{percentage}%</Text>
    </View>
    <View className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
      <View className="h-full rounded-full" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} />
    </View>
  </View>
);

const ClassAnalytics = () => {
  const router = useRouter();
  const { primaryColor, theme } = useSettings();
  const isDark = theme === 'dark';

  const [initialData, setInitialData] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [viewMode, setViewMode] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getData('initialData');
        if (data) { setInitialData(data); setClasses(data.classes || []); }

        // Fetch ALL attendance data from Firebase
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          const fbData = await readUserData('attendanceDetails');
          if (fbData) {
            const allRecords = [];
            Object.values(fbData).forEach(teacherRecords => {
              if (Array.isArray(teacherRecords)) {
                allRecords.push(...teacherRecords);
              }
            });
            setAttendanceDetails(allRecords);
          }
        } else {
          const att = await getData('attendanceDetails');
          if (att && Array.isArray(att)) setAttendanceDetails(att);
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
        const att = await getData('attendanceDetails');
        if (att && Array.isArray(att)) setAttendanceDetails(att);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Get available months for selected class
  const availableMonths = useMemo(() => {
    if (!selectedClass) return [];
    const monthSet = new Set();
    attendanceDetails.forEach(r => {
      if (r.Class === selectedClass) {
        const dt = new Date(r.Date);
        monthSet.add(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return [...monthSet].sort();
  }, [selectedClass, attendanceDetails]);

  useEffect(() => {
    if (availableMonths.length > 0) setSelectedMonthIdx(availableMonths.length - 1);
  }, [availableMonths]);

  const analytics = useMemo(() => {
    if (!selectedClass || !initialData) return null;

    let records = [];
    let label = '';

    if (viewMode === 'monthly') {
      if (availableMonths.length === 0) return null;
      const currentMonth = availableMonths[selectedMonthIdx];
      if (!currentMonth) return null;
      const [year, month] = currentMonth.split('-').map(Number);

      records = attendanceDetails.filter(r => {
        if (r.Class !== selectedClass) return false;
        const dt = new Date(r.Date);
        return dt.getFullYear() === year && dt.getMonth() + 1 === month;
      });
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      label = `${monthNames[month - 1]} ${year}`;
    } else {
      records = attendanceDetails.filter(r => r.Class === selectedClass);
      if (records.length === 0) return null;
      label = `Overall Analytics`;
    }

    const students = initialData.students?.[selectedClass] || {};
    const studentIds = Object.keys(students);

    // Per-student stats
    const studentStats = {};
    studentIds.forEach(id => { studentStats[id] = { present: 0, total: 0 }; });

    // Subject stats
    const subjectStats = {};

    // Time stats (Weekly for Monthly mode, Monthly for Overall mode)
    const timeStats = {};

    records.forEach(record => {
      // Subject
      const subj = record.Subject || 'Unknown';
      if (!subjectStats[subj]) subjectStats[subj] = { present: 0, total: 0 };

      // Time Trend
      const dt = new Date(record.Date);
      let timeKey = '';
      if (viewMode === 'monthly') {
        const weekNum = Math.ceil(dt.getDate() / 7);
        timeKey = `W${weekNum}`;
      } else {
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        timeKey = `${monthNames[dt.getMonth()]} '${String(dt.getFullYear()).slice(2)}`;
      }

      if (!timeStats[timeKey]) {
        timeStats[timeKey] = { 
          present: 0, 
          total: 0, 
          order: viewMode === 'monthly' ? timeKey : dt.getFullYear() * 100 + dt.getMonth() 
        };
      }

      studentIds.forEach(id => {
        if (record.Attendance?.[id] !== undefined) {
          const isPresent = record.Attendance[id] === true;
          if (studentStats[id]) {
            studentStats[id].total++;
            if (isPresent) studentStats[id].present++;
          }
          subjectStats[subj].total++;
          if (isPresent) subjectStats[subj].present++;
          timeStats[timeKey].total++;
          if (isPresent) timeStats[timeKey].present++;
        }
      });
    });

    // Overall class average
    let totalPresent = 0, totalPeriods = 0;
    Object.values(studentStats).forEach(s => { totalPresent += s.present; totalPeriods += s.total; });
    const classAvg = totalPeriods > 0 ? ((totalPresent / totalPeriods) * 100).toFixed(1) : '0.0';

    // Ranked students
    const ranked = studentIds
      .filter(id => studentStats[id].total > 0)
      .map(id => ({
        id,
        name: students[id] || id,
        percentage: ((studentStats[id].present / studentStats[id].total) * 100).toFixed(1),
        present: studentStats[id].present,
        total: studentStats[id].total,
      }))
      .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    const best = ranked.slice(0, 3);
    const atRisk = ranked.filter(s => parseFloat(s.percentage) < 75).sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

    // Subject breakdown
    const subjectBreakdown = Object.entries(subjectStats)
      .map(([name, data]) => ({ name, percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : '0.0' }))
      .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    // Time trend  
    const timeTrend = Object.entries(timeStats)
      .map(([key, data]) => ({ key, percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : '0.0', order: data.order }))
      .sort((a, b) => viewMode === 'monthly' ? a.key.localeCompare(b.key) : a.order - b.order)
      .map(item => ({ week: item.key, percentage: item.percentage })); // Keep output property name 'week' to match component UI below

    return { classAvg, best, atRisk, subjectBreakdown, weeklyTrend: timeTrend, monthLabel: label, totalRecords: records.length };
  }, [selectedClass, selectedMonthIdx, initialData, attendanceDetails, availableMonths, viewMode]);

  const pctColor = (pct) => {
    const n = parseFloat(pct);
    if (n >= 75) return '#10B981';
    if (n >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const medals = ['🥇', '🥈', '🥉'];
  const barColors = [primaryColor, '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600).springify()} style={{ backgroundColor: '#8B5CF6' }} className="rounded-b-[32px] px-5 pt-14 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text className="text-white/70 text-sm ml-2">Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Class Analytics</Text>
        <Text className="text-white/70 text-sm mt-1">Class-wide performance overview</Text>
      </Animated.View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isLoading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="text-text-sub text-sm mt-3">Fetching data from server...</Text>
          </View>
        )}

        {!isLoading && (
          <>
        {/* Class Selector */}
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-5">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Select Class</Text>
          <View className="bg-surface rounded-2xl border border-slate-50 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
            <View className="flex-row items-center px-4">
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#8B5CF615' }}>
                <Ionicons name="school" size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Picker selectedValue={selectedClass} onValueChange={v => setSelectedClass(v)} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  <Picker.Item label="Select Class" value="" color="#94A3B8" />
                  {classes.map((c, i) => <Picker.Item key={i} label={c} value={c} />)}
                </Picker>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* View Mode Selector */}
        {selectedClass !== '' && (
          <Animated.View entering={FadeInUp.delay(150).duration(600).springify()} className="px-5 mt-4">
            <View className="flex-row bg-surface rounded-xl p-1 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${viewMode === 'monthly' ? 'bg-[#8B5CF620]' : 'bg-transparent'}`}
                onPress={() => setViewMode('monthly')}
              >
                <Text className={`text-sm font-semibold ${viewMode === 'monthly' ? 'text-[#8B5CF6]' : 'text-text-sub'}`}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${viewMode === 'overall' ? 'bg-[#8B5CF620]' : 'bg-transparent'}`}
                onPress={() => setViewMode('overall')}
              >
                <Text className={`text-sm font-semibold ${viewMode === 'overall' ? 'text-[#8B5CF6]' : 'text-text-sub'}`}>Overall</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Month Navigator */}
        {viewMode === 'monthly' && availableMonths.length > 0 && analytics && (
          <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-4">
            <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-between border border-slate-50"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
              <TouchableOpacity
                onPress={() => setSelectedMonthIdx(Math.max(0, selectedMonthIdx - 1))}
                disabled={selectedMonthIdx === 0}
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: selectedMonthIdx === 0 ? '#F1F5F9' : '#8B5CF615' }}
              >
                <Ionicons name="chevron-back" size={16} color={selectedMonthIdx === 0 ? '#CBD5E1' : '#8B5CF6'} />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-text-main font-bold text-sm">📅 {analytics.monthLabel}</Text>
                <Text className="text-text-sub text-[10px] mt-0.5">{analytics.totalRecords} records</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedMonthIdx(Math.min(availableMonths.length - 1, selectedMonthIdx + 1))}
                disabled={selectedMonthIdx >= availableMonths.length - 1}
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: selectedMonthIdx >= availableMonths.length - 1 ? '#F1F5F9' : '#8B5CF615' }}
              >
                <Ionicons name="chevron-forward" size={16} color={selectedMonthIdx >= availableMonths.length - 1 ? '#CBD5E1' : '#8B5CF6'} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Overall Indicator */}
        {viewMode === 'overall' && analytics && (
          <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-4">
            <View className="bg-surface rounded-2xl p-4 items-center justify-center border border-slate-50"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <Text className="text-text-main font-bold text-sm">📊 {analytics.monthLabel}</Text>
                <Text className="text-text-sub text-[10px] mt-0.5">{analytics.totalRecords} overall records</Text>
            </View>
          </Animated.View>
        )}

        {analytics && (
          <>
            {/* Class Average + Weekly Trend */}
            <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-4">
              <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider">Class Average</Text>
                  <Text className="text-2xl font-bold" style={{ color: pctColor(analytics.classAvg) }}>{analytics.classAvg}%</Text>
                </View>
                {/* Weekly bars */}
                <View className="flex-row items-end justify-between" style={{ height: 80 }}>
                  {analytics.weeklyTrend.map((w, i) => {
                    const pct = parseFloat(w.percentage);
                    const barH = Math.max(8, (pct / 100) * 70);
                    return (
                      <View key={i} className="items-center flex-1">
                        <Text className="text-[8px] font-bold mb-1" style={{ color: pctColor(w.percentage) }}>{w.percentage}%</Text>
                        <View className="w-6 rounded-t-md" style={{ height: barH, backgroundColor: pctColor(w.percentage) }} />
                        <Text className="text-text-sub text-[9px] mt-1 font-medium">{w.week}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>

            {/* Best Attendance */}
            <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-4">
              <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <View className="flex-row items-center mb-3">
                  <Text className="mr-1">🏆</Text>
                  <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider">Best Attendance</Text>
                </View>
                {analytics.best.map((s, i) => (
                  <View key={i} className="flex-row items-center py-2.5 border-b border-slate-50">
                    <Text className="text-lg mr-3">{medals[i] || ''}</Text>
                    <View className="flex-1">
                      <Text className="text-text-main text-sm font-semibold" numberOfLines={1}>{s.name}</Text>
                      <Text className="text-text-sub text-[10px]">Roll: {s.id} · {s.present}/{s.total} periods</Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#ECFDF5' }}>
                      <Text className="text-emerald-600 text-xs font-bold">{s.percentage}%</Text>
                    </View>
                  </View>
                ))}
                {analytics.best.length === 0 && (
                  <Text className="text-text-sub text-xs text-center py-3">No data available</Text>
                )}
              </View>
            </Animated.View>

            {/* At Risk */}
            {analytics.atRisk.length > 0 && (
              <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} className="px-5 mt-4">
                <View className="bg-surface rounded-2xl p-5 border border-red-100" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                  <View className="flex-row items-center mb-3">
                    <Text className="mr-1">⚠️</Text>
                    <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider">Needs Attention (Below 75%)</Text>
                  </View>
                  {analytics.atRisk.slice(0, 5).map((s, i) => (
                    <View key={i} className="flex-row items-center py-2.5 border-b border-slate-50">
                      <View className="w-6 h-6 rounded-full bg-red-50 items-center justify-center mr-3">
                        <Text className="text-[10px]">🔴</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-text-main text-sm font-semibold" numberOfLines={1}>{s.name}</Text>
                        <Text className="text-text-sub text-[10px]">Roll: {s.id}</Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
                        <Text className="text-red-600 text-xs font-bold">{s.percentage}%</Text>
                      </View>
                    </View>
                  ))}
                  {analytics.atRisk.length > 5 && (
                    <Text className="text-text-sub text-xs text-center mt-2">
                      +{analytics.atRisk.length - 5} more students
                    </Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Subject-wise Turnout */}
            <Animated.View entering={FadeInUp.delay(500).duration(600).springify()} className="px-5 mt-4">
              <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-4">Subject-wise Turnout</Text>
                {analytics.subjectBreakdown.map((s, i) => (
                  <ProgressBar key={i} label={s.name} percentage={parseFloat(s.percentage)} color={barColors[i % barColors.length]} />
                ))}
              </View>
            </Animated.View>
          </>
        )}

        {/* Empty state */}
        {!analytics && selectedClass !== '' && (
          <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-10 items-center">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#8B5CF610' }}>
              <Ionicons name="analytics-outline" size={36} color="#8B5CF6" />
            </View>
            <Text className="text-text-main font-semibold text-base">No Data Yet</Text>
            <Text className="text-text-sub text-xs text-center mt-1">No attendance records found for this class</Text>
          </Animated.View>
        )}
        </>
        )}
      </ScrollView>
    </View>
  );
};

export default ClassAnalytics;
