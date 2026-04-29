import { View, Text, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState, memo } from 'react'
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router'
import { getData } from '../services/asyncStorage';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';

// Extracted and Memoized TableRow
const TableRow = memo(({ item, present, periods, index, isDark }) => {
  const [rollNo, name] = item;
  const pct = periods > 0 ? (((present[rollNo] || 0) / periods) * 100).toFixed(1) : '0.0';
  const pctNum = parseFloat(pct);

  return (
    <View 
      className="flex-row items-center px-4 py-3.5"
      style={{ backgroundColor: index % 2 === 0 ? (isDark ? '#1E293B' : '#FFFFFF') : (isDark ? '#1A2332' : '#F8FAFC') }}
    >
      <Text className="text-text-main text-xs w-[10%] text-center font-semibold">{rollNo}</Text>
      <Text className="text-text-main text-xs w-[35%] text-center" numberOfLines={1}>{name}</Text>
      <Text className="text-xs w-[15%] text-center font-semibold" style={{ color: '#10B981' }}>
        {present[rollNo] || 0}
      </Text>
      <Text className="text-xs w-[15%] text-center font-semibold" style={{ color: '#EF4444' }}>
        {periods - (present[rollNo] || 0)}
      </Text>
      <View className="w-[25%] items-center">
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: pctNum >= 75 ? '#ECFDF5' : pctNum >= 50 ? '#FFFBEB' : '#FEF2F2' }}
        >
          <Text 
            className="text-[10px] font-bold"
            style={{ color: pctNum >= 75 ? '#059669' : pctNum >= 50 ? '#D97706' : '#DC2626' }}
          >
            {pct}%
          </Text>
        </View>
      </View>
    </View>
  );
});

const SummaryTable = () => {
  const {fromDate, toDate, className, subject} = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const height = Dimensions.get('window').height;
  const [students, setStudents] = useState([]);
  const [attendanceDetails, setAttendanceDetails] = useState({});
  const [totalPeriods, setTotalPeriods] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const fetchInitialData = async () => {
    try {
      const [data, result] = await Promise.all([getData('initialData'), getData('attendanceDetails')]);
      data !== null ? setStudents(Object.entries(data.students[className])) : setStudents([]);
      result !== null ? setAttendanceDetails(result) : setAttendanceDetails({});
      data !== null && result !== null ? setIsLoading(false) : setIsLoading(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const detailsMaker = (attendanceDetails) => {
    let filteredDetails = [];
    if (attendanceDetails && Array.isArray(attendanceDetails)) {
      filteredDetails = attendanceDetails.filter(record => {
        const recordDate = new Date(record.Date);
        return recordDate >= new Date(fromDate) && recordDate <= new Date(toDate) && record.Class === className && record.Subject === subject;
      });
    }
    setTotalPeriods(filteredDetails.length);
    const result = filteredDetails.reduce((acc, record) => {
      Object.entries(record.Attendance).forEach(([studentId, present]) => {
        acc[studentId] = (acc[studentId] || 0) + (present ? 1 : 0);
      });
      return acc;
    }, {});
    setTotalPresent(result);
  };

  const [dataReady, setDataReady] = useState(false);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { 
    if (isLoading !== true) {
      detailsMaker(attendanceDetails);
      setDataReady(true);
    }
  }, [isLoading]);

  if (!dataReady) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-4" 
              style={{ backgroundColor: `${primaryColor}15` }}>
          <Ionicons name="hourglass-outline" size={36} color={primaryColor} />
        </View>
        <Text className="text-text-main text-xl font-bold text-center">{t('loading', language)}</Text>
      </View>
    );
  }

  if (dataReady && totalPeriods == 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-4" 
              style={{ backgroundColor: `${primaryColor}15` }}>
          <Ionicons name="document-text-outline" size={36} color={primaryColor} />
        </View>
        <Text className="text-text-main text-xl font-bold text-center">{t('noDataFound', language)}</Text>
        <Text className="text-text-sub text-sm text-center mt-2">
          {t('noRecordsForRange', language)}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: primaryColor }}
          className="rounded-2xl px-8 py-3 mt-6 flex-row items-center"
        >
          <Ionicons name="arrow-back" size={16} color="white" />
          <Text className="text-white font-semibold ml-2">{t('goBack', language)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Gradient Header */}
      <Animated.View 
        entering={FadeInDown.duration(600).springify()}
        style={{ backgroundColor: primaryColor }}
        className="rounded-b-[32px] px-5 pt-14 pb-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text className="text-white/70 text-sm ml-2">{t('back', language)}</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{className}</Text>
        <View className="flex-row items-center mt-1 flex-wrap">
          <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-2">{subject}</Text>
          <View className="w-1 h-1 bg-white/40 rounded-full mx-3" />
          <Text className="text-white/70 text-xs">{fromDate} → {toDate}</Text>
        </View>
      </Animated.View>

      {/* Period Badge */}
      <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 -mt-5">
        <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-center border border-slate-50"
              style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
          <Ionicons name="layers-outline" size={18} color={primaryColor} />
          <Text className="text-text-main font-bold text-base ml-2">
            {totalPeriods} {totalPeriods !== 1 ? t('totalPeriodsPlural', language) : t('totalPeriods', language)}
          </Text>
        </View>
      </Animated.View>

      {/* Table */}
      <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="flex-1 px-5 mt-5">
        <View className="bg-surface rounded-2xl overflow-hidden border border-slate-50 flex-1"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
          {/* Table Header */}
          <View className="flex-row px-4 py-3" style={{ backgroundColor: `${primaryColor}15` }}>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[10%] text-center uppercase">{t('index', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[35%] text-center uppercase">{t('name', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[15%] text-center uppercase">{t('p', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[15%] text-center uppercase">{t('a', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[25%] text-center uppercase">{t('pct', language)}</Text>
          </View>

          {isLoading ? (
            <View className="p-8 items-center">
              <Text className="text-text-sub text-sm">{t('loading', language)}</Text>
            </View>
          ) : (
            <ScrollView ref={scrollViewRef} style={{ maxHeight: height * 0.55 }}>
              {students.map((student, index) => (
                <TableRow key={index} item={student} present={totalPresent} periods={totalPeriods} index={index} isDark={isDark} />
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>

      <View className="pb-8" />
    </View>
  );
}

export default SummaryTable