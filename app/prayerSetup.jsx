import { View, Text, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import DatePickerCross from '../components/DatePickerCross';
import { getData } from '../services/asyncStorage';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';

const PRAYER_LIST = [
  { key: 'fajr', icon: 'sunny-outline', iconSet: 'ionicons', color: '#F59E0B' },
  { key: 'dhuhr', icon: 'sunny', iconSet: 'ionicons', color: '#EF4444' },
  { key: 'asr', icon: 'partly-sunny-outline', iconSet: 'ionicons', color: '#F97316' },
  { key: 'maghrib', icon: 'cloudy-night-outline', iconSet: 'ionicons', color: '#8B5CF6' },
  { key: 'isha', icon: 'moon-outline', iconSet: 'ionicons', color: '#3B82F6' },
  { key: 'thahajjud', icon: 'weather-night', iconSet: 'material', color: '#6366F1' },
  { key: 'luha', icon: 'mosque', iconSet: 'material', color: '#059669' },
];

const PrayerIcon = ({ item, size }) => {
  if (item.iconSet === 'material') {
    return <MaterialCommunityIcons name={item.icon} size={size} color={item.color} />;
  }
  return <Ionicons name={item.icon} size={size} color={item.color} />;
};

export default function PrayerSetup() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [className, setClassName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPrayer, setSelectedPrayer] = useState('');
  const [initialData, setInitialData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState({});
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const router = useRouter();
  const { nextRoute, titleKey } = useLocalSearchParams();

  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await getData('initialData');
      if (data !== null) {
        setInitialData(data);
        setClasses(data.classes);
      }
    };
    fetchInitialData();

    // Auto-select prayer based on time
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const time = hour + minutes / 60;

    let autoPrayer = '';
    if (time >= 4 && time < 7) autoPrayer = 'fajr';
    else if (time >= 7 && time < 11.5) autoPrayer = 'luha';
    else if (time >= 11.5 && time < 15) autoPrayer = 'dhuhr';
    else if (time >= 15 && time < 18) autoPrayer = 'asr';
    else if (time >= 18 && time < 19.5) autoPrayer = 'maghrib';
    else if (time >= 19.5 && time < 23) autoPrayer = 'isha';
    else autoPrayer = 'thahajjud';

    setSelectedPrayer(autoPrayer);
  }, []);

  useEffect(() => {
    if (initialData && className && initialData.students?.[className]) {
      setStudentsInClass(initialData.students[className]);
      setSelectedStudent(''); // Reset student when class changes
    } else {
      setStudentsInClass({});
    }
  }, [className, initialData]);

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
    setShowPicker(false);
  };

  const handleContinue = () => {
    if (className === '') {
      alert(t('pleaseFillForm', language));
      return;
    }
    
    // For student overview, we need a student selected
    if (nextRoute === '/studentPrayerOverview' && selectedStudent === '') {
      alert(language === 'ar' ? 'يرجى اختيار طالب' : 'Please select a student');
      return;
    }

    // For prayerTable, prayer must be selected
    if (nextRoute === '/prayerTable' && selectedPrayer === '') {
      alert(t('pleaseFillForm', language));
      return;
    }

    // Route logic
    if (nextRoute === '/studentPrayerOverview') {
      router.push({
        pathname: nextRoute,
        params: { className, studentId: selectedStudent },
      });
    } else {
      router.push({
        pathname: nextRoute || '/prayerTable',
        params: { 
          date: date.toDateString(), 
          className, 
          prayer: selectedPrayer 
        },
      });
    }
  };

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const isStudentOverview = nextRoute === '/studentPrayerOverview';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with back button */}
      <View className="px-5 py-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-slate-100 shadow-sm"
        >
          <Ionicons name={language === 'ar' ? 'chevron-forward' : 'chevron-back'} size={24} color={isDark ? '#F8FAFC' : '#0F172A'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-main ml-4">
          {t(titleKey || 'markPrayers', language)}
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Class Selector Card */}
        <Animated.View entering={FadeInUp.delay(50).duration(600).springify()} className="px-5 mt-2">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('class', language)}</Text>
          <View 
            className="bg-surface rounded-2xl border border-slate-50 overflow-hidden"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
          >
            <View className="flex-row items-center px-4">
              <View 
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Ionicons name="school" size={16} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Picker
                  selectedValue={className}
                  onValueChange={(itemValue) => setClassName(itemValue)}
                  style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                >
                  <Picker.Item label={t('selectClass', language)} value="" color="#94A3B8" />
                  {classes.map((item, index) => (
                    <Picker.Item key={index} label={item} value={item} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Student Selector Card (Only for Student Overview) */}
        {isStudentOverview && className !== '' && (
          <Animated.View entering={FadeIn.duration(400)} className="px-5 mt-5">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{language === 'ar' ? 'الطالب' : 'Student'}</Text>
            <View 
              className="bg-surface rounded-2xl border border-slate-50 overflow-hidden"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
            >
              <View className="flex-row items-center px-4">
                <View 
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Ionicons name="person" size={16} color={primaryColor} />
                </View>
                <View className="flex-1">
                  <Picker
                    selectedValue={selectedStudent}
                    onValueChange={(itemValue) => setSelectedStudent(itemValue)}
                    style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                  >
                    <Picker.Item label={language === 'ar' ? 'اختر الطالب' : 'Select Student'} value="" color="#94A3B8" />
                    {Object.entries(studentsInClass).map(([rollNo, name]) => (
                      <Picker.Item key={rollNo} label={`${rollNo} - ${name}`} value={rollNo} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Date Picker Card (Hide for Analytics/Overview) */}
        {!isStudentOverview && nextRoute !== '/prayerAnalytics' && (
          <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-5">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('date', language)}</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="bg-surface rounded-2xl p-4 flex-row items-center border border-slate-50"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
              activeOpacity={0.7}
            >
              <View 
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Text style={{ color: primaryColor }} className="text-lg font-bold">{date.getDate()}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-text-main font-semibold text-base">
                  {days[date.getDay()]}, {months[date.getMonth()]} {date.getDate()}
                </Text>
                <Text className="text-text-sub text-xs mt-0.5">{date.getFullYear()}</Text>
              </View>
              <Ionicons name="calendar" size={20} color={primaryColor} />
            </TouchableOpacity>
            {showPicker && (
              <DatePickerCross
                mode="date"
                value={date}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                isDark={isDark}
              />
            )}
          </Animated.View>
        )}

        {/* Prayer Selector (Hide for Analytics/Overview) */}
        {!isStudentOverview && nextRoute !== '/prayerAnalytics' && (
          <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-5">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('prayer', language)}</Text>
            <View className="flex-row flex-wrap gap-2.5">
              {PRAYER_LIST.map((p) => {
                const isSelected = selectedPrayer === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setSelectedPrayer(p.key)}
                    className="flex-row items-center rounded-2xl px-4 py-3 border-2"
                    style={{
                      borderColor: isSelected ? p.color : 'transparent',
                      backgroundColor: isSelected ? `${p.color}12` : (isDark ? '#1E293B' : '#F8FAFC'),
                      shadowColor: '#000',
                      shadowOpacity: isSelected ? 0.08 : 0.02,
                      shadowRadius: 8,
                      elevation: isSelected ? 4 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <View 
                      className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
                      style={{ backgroundColor: `${p.color}20` }}
                    >
                      <PrayerIcon item={p} size={16} />
                    </View>
                    <Text 
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? p.color : (isDark ? '#94A3B8' : '#64748B') }}
                    >
                      {t(p.key, language)}
                    </Text>
                    {isSelected && (
                      <View className="ml-2">
                        <Ionicons name="checkmark-circle" size={16} color={p.color} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* CTA Button */}
        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-8">
          <TouchableOpacity
            style={{ backgroundColor: primaryColor }}
            className="rounded-2xl p-4 flex-row items-center justify-center mb-4 shadow-lg shadow-blue-200"
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base ml-2">
              {t('continueBtn', language)}
            </Text>
            <View className="flex-1" />
            <Ionicons name={language === 'ar' ? "arrow-back" : "arrow-forward"} size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
