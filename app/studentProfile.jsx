import { View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { getData } from '../services/asyncStorage';
import { readUserData } from '../services/firebase_crud';
import { useRouter } from 'expo-router';
import { useSettings } from '../services/SettingsContext';
import NetInfo from '@react-native-community/netinfo';
import { t } from '../services/translations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Progress Bar ──
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

// ── Heatmap Day Dot ──
const DayDot = ({ status, size = 28 }) => {
  const bg = status === 'present' ? '#10B981' : status === 'absent' ? '#EF4444' : status === 'late' ? '#F59E0B' : 'transparent';
  const border = status === 'none' ? '#E2E8F0' : 'transparent';
  return (
    <View style={{ width: size, height: size, borderRadius: 8, backgroundColor: bg, borderWidth: status === 'none' ? 1 : 0, borderColor: border, margin: 2 }} />
  );
};

const StudentProfile = () => {
  const router = useRouter();
  const { primaryColor, theme } = useSettings();
  const isDark = theme === 'dark';

  const [initialData, setInitialData] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentsInClass, setStudentsInClass] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [blacklistHistory, setBlacklistHistory] = useState([]);
  const { language } = useSettings();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load initialData (classes & students list)
        const data = await getData('initialData');
        if (data) { setInitialData(data); setClasses(data.classes || []); }

        // Fetch ALL attendance data from Firebase
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          const fbData = await readUserData('attendanceDetails');
          if (fbData) {
            // fbData is { teacherName: [ records... ], teacherName2: [ records... ] }
            // Flatten all teachers' records into one array
            const allRecords = [];
            Object.values(fbData).forEach(teacherRecords => {
              if (Array.isArray(teacherRecords)) {
                allRecords.push(...teacherRecords);
              }
            });
            setAttendanceDetails(allRecords);
          }
        } else {
          // Offline fallback: use local data
          const att = await getData('attendanceDetails');
          if (att && Array.isArray(att)) setAttendanceDetails(att);
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
        // Fallback to local
        const att = await getData('attendanceDetails');
        if (att && Array.isArray(att)) setAttendanceDetails(att);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialData && selectedClass && initialData.students?.[selectedClass]) {
      setStudentsInClass(initialData.students[selectedClass]);
      setSelectedStudent('');
    } else {
      setStudentsInClass({});
    }
  }, [selectedClass, initialData]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedStudent) {
        setBlacklistHistory([]);
        return;
      }
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          const data = await readUserData(`blacklistHistory/${selectedStudent}`);
          if (data) {
            const histArray = Object.keys(data).map(blockId => data[blockId]);
            histArray.sort((a, b) => new Date(b.blockedAt) - new Date(a.blockedAt));
            setBlacklistHistory(histArray);
          } else {
            setBlacklistHistory([]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [selectedStudent]);

  // ── Compute Analytics ──
  const analytics = useMemo(() => {
    if (!selectedStudent || !selectedClass || attendanceDetails.length === 0) return null;

    const records = attendanceDetails.filter(r => r.Class === selectedClass);
    let totalPeriods = 0;
    let totalPresent = 0;
    const subjectMap = {};
    const monthlyMap = {};
    const dailyMap = {};

    records.forEach(record => {
      if (record.Attendance?.[selectedStudent] === undefined) return;
      const isPresent = record.Attendance[selectedStudent] === true;
      totalPeriods++;
      if (isPresent) totalPresent++;

      // Subject breakdown
      const subj = record.Subject || 'Unknown';
      if (!subjectMap[subj]) subjectMap[subj] = { present: 0, total: 0 };
      subjectMap[subj].total++;
      if (isPresent) subjectMap[subj].present++;

      // Monthly trend
      const dt = new Date(record.Date);
      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { present: 0, total: 0 };
      monthlyMap[monthKey].total++;
      if (isPresent) monthlyMap[monthKey].present++;

      // Daily calendar
      const dayKey = dt.toDateString();
      if (!dailyMap[dayKey]) dailyMap[dayKey] = { present: 0, absent: 0 };
      if (isPresent) dailyMap[dayKey].present++;
      else dailyMap[dayKey].absent++;
    });

    const overallPct = totalPeriods > 0 ? ((totalPresent / totalPeriods) * 100).toFixed(1) : '0.0';

    const subjectBreakdown = Object.entries(subjectMap)
      .map(([name, data]) => ({ name, percentage: ((data.present / data.total) * 100).toFixed(1), present: data.present, total: data.total }))
      .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    const monthlyTrend = Object.entries(monthlyMap)
      .map(([key, data]) => ({ month: key, percentage: ((data.present / data.total) * 100).toFixed(1) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calendar heatmap for latest month
    const months = Object.keys(monthlyMap).sort();
    const latestMonth = months.length > 0 ? months[months.length - 1] : null;
    let calendarData = [];
    if (latestMonth) {
      const [year, month] = latestMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
      // fill empty cells
      for (let i = 0; i < firstDayOfWeek; i++) calendarData.push({ day: 0, status: 'empty' });
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year, month - 1, d).toDateString();
        if (dailyMap[dateStr]) {
          calendarData.push({ day: d, status: dailyMap[dateStr].absent > 0 ? (dailyMap[dateStr].present > 0 ? 'late' : 'absent') : 'present' });
        } else {
          calendarData.push({ day: d, status: 'none' });
        }
      }
    }

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const latestMonthLabel = latestMonth ? `${monthNames[parseInt(latestMonth.split('-')[1]) - 1]} ${latestMonth.split('-')[0]}` : '';

    return { totalPeriods, totalPresent, totalAbsent: totalPeriods - totalPresent, overallPct, subjectBreakdown, monthlyTrend, calendarData, latestMonthLabel };
  }, [selectedStudent, selectedClass, attendanceDetails]);

  const studentName = studentsInClass[selectedStudent] || '';

  // Color helpers
  const pctColor = (pct) => {
    const n = parseFloat(pct);
    if (n >= 75) return '#10B981';
    if (n >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const barColors = [primaryColor, '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#14B8A6'];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600).springify()} style={{ backgroundColor: primaryColor }} className="rounded-b-[32px] px-5 pt-14 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text className="text-white/70 text-sm ml-2">Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Student Profile</Text>
        <Text className="text-white/70 text-sm mt-1">Individual attendance analytics</Text>
      </Animated.View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isLoading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={primaryColor} />
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
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}15` }}>
                <Ionicons name="school" size={16} color={primaryColor} />
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

        {/* Student Selector */}
        {selectedClass !== '' && (
          <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-4">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Select Student</Text>
            <View className="bg-surface rounded-2xl border border-slate-50 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
              <View className="flex-row items-center px-4">
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Ionicons name="person" size={16} color={primaryColor} />
                </View>
                <View className="flex-1">
                  <Picker selectedValue={selectedStudent} onValueChange={v => setSelectedStudent(v)} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    <Picker.Item label="Select Student" value="" color="#94A3B8" />
                    {Object.entries(studentsInClass).map(([rollNo, name]) => (
                      <Picker.Item key={rollNo} label={`${rollNo} - ${name}`} value={rollNo} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Analytics Content */}
        {analytics && selectedStudent !== '' && (
          <>
            {/* Student Info Card */}
            <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-5">
              <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: primaryColor }}>
                    <Text className="text-white text-xl font-bold">{studentName.charAt(0) || '?'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-main text-lg font-bold" numberOfLines={1}>{studentName}</Text>
                    <Text className="text-text-sub text-xs mt-0.5">Roll: {selectedStudent} · {selectedClass}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Overall Attendance Ring */}
            <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-4">
              <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-4">Overall Attendance</Text>
                <View className="items-center">
                  {/* Big Circle */}
                  <View className="w-32 h-32 rounded-full items-center justify-center border-[8px] mb-4"
                        style={{ borderColor: pctColor(analytics.overallPct) }}>
                    <Text className="text-3xl font-bold" style={{ color: pctColor(analytics.overallPct) }}>
                      {analytics.overallPct}%
                    </Text>
                  </View>
                  {/* Present / Absent Row */}
                  <View className="flex-row w-full justify-around">
                    <View className="items-center">
                      <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mb-1">
                        <Text className="text-xs font-bold text-emerald-600">✓</Text>
                      </View>
                      <Text className="text-text-main font-bold text-lg">{analytics.totalPresent}</Text>
                      <Text className="text-text-sub text-[10px] uppercase">Present</Text>
                    </View>
                    <View className="items-center">
                      <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center mb-1">
                        <Text className="text-xs font-bold text-red-500">✕</Text>
                      </View>
                      <Text className="text-text-main font-bold text-lg">{analytics.totalAbsent}</Text>
                      <Text className="text-text-sub text-[10px] uppercase">Absent</Text>
                    </View>
                    <View className="items-center">
                      <View className="w-8 h-8 rounded-full items-center justify-center mb-1" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Ionicons name="layers-outline" size={14} color={primaryColor} />
                      </View>
                      <Text className="text-text-main font-bold text-lg">{analytics.totalPeriods}</Text>
                      <Text className="text-text-sub text-[10px] uppercase">Total</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Subject Breakdown — Lessons, Present & Absent */}
            <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-4">
              <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-4">Subject Breakdown</Text>
                {analytics.subjectBreakdown.map((s, i) => (
                  <View key={i} className="mb-4">
                    <ProgressBar label={s.name} percentage={parseFloat(s.percentage)} color={barColors[i % barColors.length]} />
                    <View className="flex-row items-center mt-1 ml-1 gap-3">
                      <View className="flex-row items-center">
                        <View className="w-5 h-5 rounded items-center justify-center mr-1" style={{ backgroundColor: `${barColors[i % barColors.length]}15` }}>
                          <Ionicons name="layers-outline" size={10} color={barColors[i % barColors.length]} />
                        </View>
                        <Text className="text-text-sub text-[10px]">{s.total} lessons</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-5 h-5 rounded items-center justify-center mr-1 bg-emerald-50">
                          <Text className="text-[8px] font-bold text-emerald-600">✓</Text>
                        </View>
                        <Text className="text-text-sub text-[10px]">{s.present} present</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-5 h-5 rounded items-center justify-center mr-1 bg-red-50">
                          <Text className="text-[8px] font-bold text-red-500">✕</Text>
                        </View>
                        <Text className="text-text-sub text-[10px]">{s.total - s.present} absent</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Monthly Trend */}
            {analytics.monthlyTrend.length > 1 && (
              <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} className="px-5 mt-4">
                <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                  <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-4">Monthly Trend</Text>
                  {/* Simple bar chart */}
                  <View className="flex-row items-end justify-between" style={{ height: 120 }}>
                    {analytics.monthlyTrend.map((m, i) => {
                      const pct = parseFloat(m.percentage);
                      const barH = Math.max(8, (pct / 100) * 100);
                      const monthLabel = m.month.split('-')[1];
                      const monthNames = ["J","F","M","A","M","J","J","A","S","O","N","D"];
                      return (
                        <View key={i} className="items-center flex-1">
                          <Text className="text-[9px] font-bold mb-1" style={{ color: pctColor(m.percentage) }}>{m.percentage}%</Text>
                          <View className="w-5 rounded-t-md" style={{ height: barH, backgroundColor: pctColor(m.percentage) }} />
                          <Text className="text-text-sub text-[9px] mt-1">{monthNames[parseInt(monthLabel) - 1]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Calendar Heatmap */}
            {analytics.calendarData.length > 0 && (
              <Animated.View entering={FadeInUp.delay(500).duration(600).springify()} className="px-5 mt-4">
                <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                  <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-1">
                    Calendar Heatmap
                  </Text>
                  <Text className="text-text-sub text-[10px] mb-3">{analytics.latestMonthLabel}</Text>

                  {/* Day labels */}
                  <View className="flex-row mb-1">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <View key={d} style={{ width: 32, alignItems: 'center' }}>
                        <Text className="text-text-sub text-[9px] font-medium">{d}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Calendar grid */}
                  <View className="flex-row flex-wrap">
                    {analytics.calendarData.map((cell, i) => (
                      <View key={i} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                        {cell.status === 'empty' ? (
                          <View style={{ width: 24, height: 24 }} />
                        ) : (
                          <DayDot status={cell.status} size={24} />
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Legend */}
                  <View className="flex-row mt-3 justify-center gap-4">
                    {[{ s: 'present', l: 'Present', c: '#10B981' }, { s: 'absent', l: 'Absent', c: '#EF4444' }, { s: 'late', l: 'Mixed', c: '#F59E0B' }].map(item => (
                      <View key={item.s} className="flex-row items-center">
                        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.c, marginRight: 4 }} />
                        <Text className="text-text-sub text-[10px]">{item.l}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Blacklist History */}
            {blacklistHistory.length > 0 && (
              <Animated.View entering={FadeInUp.delay(600).duration(600).springify()} className="px-5 mt-4">
                <View className="bg-surface rounded-2xl p-5 border border-slate-50" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                  <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-4">
                    {t('blacklistHistory', language)}
                  </Text>
                  {blacklistHistory.map((item, i) => {
                    const isActive = item.status === 'blocked';
                    const dateStr = new Date(item.blockedAt).toLocaleDateString();
                    return (
                      <View key={i} className="mb-3 p-3 rounded-xl border border-slate-100" style={{ backgroundColor: isActive ? '#FEF2F2' : '#F8FAFC' }}>
                        <View className="flex-row justify-between items-center mb-2">
                          <View className="flex-row items-center">
                            <MaterialCommunityIcons name={isActive ? "account-alert" : "account-check"} size={16} color={isActive ? "#DC2626" : "#10B981"} />
                            <Text className="text-xs font-bold ml-1" style={{ color: isActive ? '#DC2626' : '#10B981' }}>
                              {isActive ? t('active', language) : t('unblocked', language)}
                            </Text>
                          </View>
                          <Text className="text-[10px] text-text-sub">{dateStr}</Text>
                        </View>
                        <Text className="text-xs text-text-main mb-2">{item.reason}</Text>
                        <View className="flex-row items-center">
                          <Ionicons name="person-outline" size={12} color="#64748B" />
                          <Text className="text-[10px] text-text-sub ml-1">{t('blockedBy', language)}: {item.blockedBy}</Text>
                        </View>
                        {!isActive && item.unblockedBy && (
                          <View className="flex-row items-center mt-1">
                            <MaterialCommunityIcons name="account-key-outline" size={12} color="#10B981" />
                            <Text className="text-[10px] text-emerald-600 ml-1">{t('unblockedBy', language)}: {item.unblockedBy}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* Empty state */}
        {(!selectedStudent || !analytics) && selectedClass !== '' && (
          <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-10 items-center">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${primaryColor}10` }}>
              <Ionicons name="person-outline" size={36} color={primaryColor} />
            </View>
            <Text className="text-text-main font-semibold text-base">Select a Student</Text>
            <Text className="text-text-sub text-xs text-center mt-1">Choose a student to view their detailed analytics</Text>
          </Animated.View>
        )}
        </>
        )}
      </ScrollView>
    </View>
  );
};

export default StudentProfile;
