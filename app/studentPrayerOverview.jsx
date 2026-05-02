import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { getData } from '../services/asyncStorage';
import { readUserData } from '../services/firebase_crud';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../services/SettingsContext';
import NetInfo from '@react-native-community/netinfo';
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

export default function StudentPrayerOverview() {
  const router = useRouter();
  const { className, studentId } = useLocalSearchParams();
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prayerDetails, setPrayerDetails] = useState([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getData('initialData');
        if (data) { setInitialData(data); }

        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          const fbPrayers = await readUserData('prayerDetails');
          if (fbPrayers) {
            const allPrayers = [];
            Object.values(fbPrayers).forEach(teacherPrayers => {
              if (Array.isArray(teacherPrayers)) {
                allPrayers.push(...teacherPrayers);
              } else if (teacherPrayers) {
                allPrayers.push(...Object.values(teacherPrayers));
              }
            });
            setPrayerDetails(allPrayers);
          }
        } else {
          const pr = await getData('prayerDetails');
          if (pr && Array.isArray(pr)) setPrayerDetails(pr);
        }
      } catch (error) {
        console.error('Error loading prayer data:', error);
        const pr = await getData('prayerDetails');
        if (pr && Array.isArray(pr)) setPrayerDetails(pr);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const studentName = useMemo(() => {
    if (initialData && className && studentId && initialData.students?.[className]) {
      return initialData.students[className][studentId] || '';
    }
    return '';
  }, [initialData, className, studentId]);

  const analytics = useMemo(() => {
    if (!studentId || !className || prayerDetails.length === 0) return null;

    const pRecords = prayerDetails.filter(r => r.Class === className);
    
    let totalExpectedPrayers = 0;
    let totalPresentPrayers = 0;

    const prayerStats = {};
    PRAYERS.forEach((p) => {
      prayerStats[p] = { present: 0, total: 0 };
    });
    
    pRecords.forEach(record => {
      if (record.Attendance?.[studentId] === undefined) return;
      const isPresent = record.Attendance[studentId] === true;
      const pKey = record.Prayer;
      
      if (prayerStats[pKey]) {
        prayerStats[pKey].total++;
        totalExpectedPrayers++;
        if (isPresent) {
          prayerStats[pKey].present++;
          totalPresentPrayers++;
        }
      }
    });

    const overallPct = totalExpectedPrayers > 0 
      ? ((totalPresentPrayers / totalExpectedPrayers) * 100).toFixed(0) 
      : '0';

    return { totalExpectedPrayers, totalPresentPrayers, overallPct, prayerStats };
  }, [studentId, className, prayerDetails]);

  return (
    <View className="flex-1 bg-background">
      {/* Header aligned with analytics theme */}
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
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold" numberOfLines={1}>{studentName || t('studentOverview', language)}</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-2">{studentId}</Text>
          <View className="w-1 h-1 bg-white/40 rounded-full mx-3" />
          <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-2">{className}</Text>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-text-sub text-sm mt-3">{t('loading', language)}</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {analytics && studentId ? (
              <>
                {analytics.totalExpectedPrayers === 0 ? (
                  <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-10 items-center">
                    <View className="bg-surface rounded-2xl p-8 items-center border border-slate-50 dark:border-slate-800 w-full">
                      <View className="w-16 h-16 rounded-full items-center justify-center mb-3"
                            style={{ backgroundColor: `${primaryColor}10` }}>
                        <Ionicons name="moon-outline" size={28} color={primaryColor} />
                      </View>
                      <Text className="text-text-main font-semibold">{t('noPrayerData', language)}</Text>
                    </View>
                  </Animated.View>
                ) : (
                  <>
                    {/* Overall Stats (Dual Card Layout) */}
                    <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="flex-row px-5 mt-5 gap-3">
                      <View className="flex-1 bg-surface rounded-2xl p-4 items-center border border-slate-50 dark:border-slate-800"
                            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                        <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                              style={{ backgroundColor: `${primaryColor}15` }}>
                          <Ionicons name="bar-chart" size={18} color={primaryColor} />
                        </View>
                        <Text className="text-2xl font-bold text-text-main">{analytics.overallPct}%</Text>
                        <Text className="text-text-sub text-[10px] uppercase font-medium tracking-wider mt-0.5">{t('avgCompletion', language)}</Text>
                      </View>
                      <View className="flex-1 bg-surface rounded-2xl p-4 items-center border border-slate-50 dark:border-slate-800"
                            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                        <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                              style={{ backgroundColor: '#10B98115' }}>
                          <Ionicons name="documents-outline" size={18} color="#10B981" />
                        </View>
                        <Text className="text-2xl font-bold text-text-main">{analytics.totalExpectedPrayers}</Text>
                        <Text className="text-text-sub text-[10px] uppercase font-medium tracking-wider mt-0.5">{t('totalLabel', language)}</Text>
                      </View>
                    </Animated.View>

                    {/* Prayer Breakdown */}
                    <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-6">
                      <Text className="text-text-main text-base font-bold mb-3">{t('prayerBreakdown', language)}</Text>
                      <View className="bg-surface rounded-2xl p-4 border border-slate-50 dark:border-slate-800"
                            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
                        {PRAYERS.map((prayer, idx) => {
                          const stats = analytics.prayerStats[prayer];
                          if (stats.total === 0) return null; // Only show prayers that have records
                          
                          const pct = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0;
                          
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
                                    <Text className="text-text-sub text-[10px] ml-2">({stats.total} {t('totalLabel', language)})</Text>
                                  </View>
                                  <Text className="text-text-sub text-xs font-bold">{pct}%</Text>
                                </View>
                                <View className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
                  </>
                )}
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-10 items-center">
                <Ionicons name="alert-circle-outline" size={48} color={primaryColor} style={{ opacity: 0.5 }} />
                <Text className="text-text-main font-semibold mt-4 text-center">{language === 'ar' ? 'بيانات الطالب غير متوفرة' : 'Student data not provided'}</Text>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
