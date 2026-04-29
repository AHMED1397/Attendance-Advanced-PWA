import { View, Text, ScrollView, Dimensions, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getData, getSigleData, storeAttendance } from '../services/asyncStorage';
import Checkbox from 'expo-checkbox';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';
import { fetchQadrConfig } from '../services/qadrConfig';
import QadrProgressModal from '../components/QadrProgressModal';

// Memoized TableRow Component
const TableRow = memo(({ item, index, isPresent, onToggle, primaryColor, isDark }) => {
  const [rollNo, name] = item;
  return (
    <View 
      className="flex-row items-center px-4 py-3.5"
      style={{ backgroundColor: index % 2 === 0 ? (isDark ? '#1E293B' : '#FFFFFF') : (isDark ? '#1A2332' : '#F8FAFC') }}
    >
      <Text className="text-text-sub text-xs w-[10%] text-center font-medium">{index + 1}</Text>
      <Text className="text-text-main text-xs w-[25%] text-center font-semibold">{rollNo}</Text>
      <Text className="text-text-main text-xs w-[45%] text-center" numberOfLines={1}>{name}</Text>
      <View className="w-[20%] items-center">
        <Checkbox
          value={isPresent}
          onValueChange={(newValue) => onToggle(rollNo, newValue)}
          color={isPresent ? primaryColor : '#CBD5E1'}
          style={{ width: 22, height: 22, borderRadius: 6 }}
        />
      </View>
    </View>
  );
});

const AttendanceTable = () => {
  const params = useLocalSearchParams();
  const { date, className, subject } = params;
  const router = useRouter();
  const { height } = Dimensions.get('window');
  const [initialData, setInitialData] = useState({});
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  // Qadr progress tracking
  const [showQadrModal, setShowQadrModal] = useState(false);
  const [qadrConfig, setQadrConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData('initialData');
        if (data) {
          setInitialData(data);
          if (data.students?.[className]) {
            const initialAttendance = {};
            Object.keys(data.students[className]).forEach((rollNo) => {
              initialAttendance[rollNo] = true;
            });
            setAttendance(initialAttendance);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Fetch qadr config from Firebase (async)
    const loadQadrConfig = async () => {
      const matchedConfig = await fetchQadrConfig(className, subject);
      if (matchedConfig) {
        setQadrConfig(matchedConfig);
      }
    };
    loadQadrConfig();
  }, [className, subject]);

  const handleToggle = useCallback((rollNo, newValue) => {
    setAttendance((prev) => ({ ...prev, [rollNo]: newValue }));
  }, []);

  const handleSubmit = async () => {
    // Save attendance first
    await storeAttendance({
      Teacher: await getSigleData('userName'),
      Date: date,
      Class: className,
      Subject: subject,
      Attendance: attendance,
    });

    // If this class+subject has qadr tracking, show the progress modal
    if (qadrConfig) {
      setShowQadrModal(true);
    } else {
      // Normal flow
      alert(t('dataSubmitted', language));
      router.push('/(tabs)');
    }
  };

  const handleQadrModalClose = (saved) => {
    setShowQadrModal(false);
    alert(t('dataSubmitted', language));
    router.push('/(tabs)');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="text-text-sub mt-3 text-sm">{t('loadingStudents', language)}</Text>
      </View>
    );
  }

  const studentData = initialData.students?.[className]
    ? Object.entries(initialData.students[className])
    : [];

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = studentData.length - presentCount;
  const percentage = studentData.length > 0 ? ((presentCount / studentData.length) * 100).toFixed(1) : '0';

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
        <View className="flex-row items-center mt-1">
          <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-2">{subject}</Text>
          <View className="w-1 h-1 bg-white/40 rounded-full mx-3" />
          <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-2">{date}</Text>
        </View>
      </Animated.View>

      {/* Stats Row */}
      <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="flex-row px-5 -mt-5 gap-3">
        {[
          { label: t("present", language), value: presentCount, color: "#10B981" },
          { label: t("absent", language), value: absentCount, color: "#EF4444" },
          { label: t("rate", language), value: `${percentage}%`, color: primaryColor },
        ].map((s, i) => (
          <View key={i} className="flex-1 bg-surface rounded-2xl p-3 items-center border border-slate-50"
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
            <Text className="text-lg font-bold" style={{ color: s.color }}>{s.value}</Text>
            <Text className="text-text-sub text-[10px] uppercase font-medium tracking-wider">{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Table */}
      <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="flex-1 px-5 mt-5">
        <View className="bg-surface rounded-2xl overflow-hidden border border-slate-50 flex-1"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
          {/* Table Header */}
          <View className="flex-row px-4 py-3" style={{ backgroundColor: `${primaryColor}15` }}>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[10%] text-center uppercase">{t('no', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[25%] text-center uppercase">{t('index', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[45%] text-center uppercase">{t('name', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[20%] text-center uppercase">{t('status', language)}</Text>
          </View>

          {studentData.length > 0 ? (
            <FlatList
              data={studentData}
              renderItem={({ item, index }) => (
                <TableRow 
                  item={item} 
                  index={index} 
                  isPresent={attendance[item[0]]}
                  onToggle={handleToggle}
                  primaryColor={primaryColor}
                  isDark={isDark}
                />
              )}
              keyExtractor={(item) => item[0]}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          ) : (
            <View className="p-8 items-center">
              <Ionicons name="people-outline" size={32} color="#94A3B8" />
              <Text className="text-text-sub text-sm mt-2">{t('noStudentsFound', language)}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Submit Button */}
      <Animated.View entering={FadeInUp.delay(300).duration(400)} className="px-5 py-4 pb-8">
        <TouchableOpacity
          onPress={handleSubmit}
          style={{ backgroundColor: primaryColor }}
          className="rounded-2xl p-4 flex-row items-center justify-center"
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text className="text-white font-bold text-base ml-2">{t('submitAttendance', language)}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Qadr Progress Modal */}
      {qadrConfig && (
        <QadrProgressModal
          visible={showQadrModal}
          onClose={handleQadrModalClose}
          config={qadrConfig}
          className={className}
          primaryColor={primaryColor}
          isDark={isDark}
          date={date}
        />
      )}
    </View>
  );
};

export default AttendanceTable;