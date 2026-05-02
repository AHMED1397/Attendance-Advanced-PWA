import { View, Text, SafeAreaView, TouchableOpacity, Platform, ScrollView, TextInput, Alert, FlatList } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { getData, storePrayer, getSigleData } from '../services/asyncStorage';
import DatePickerCross from '../components/DatePickerCross';
import { useRouter } from 'expo-router';
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

const QuickPrayer = () => {
  const router = useRouter();
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const [initialData, setInitialData] = useState({});
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedPrayer, setSelectedPrayer] = useState('asr'); // Default to asr as it's common
  const [rollInput, setRollInput] = useState('');
  const [absentRecords, setAbsentRecords] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData('initialData');
        if (data) setInitialData(data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

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

  const toggleClass = (cls) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const handleRollInput = (text) => {
    // Only allow numbers
    const cleanText = text.replace(/[^0-9]/g, '');
    setRollInput(cleanText);

    if (cleanText.length === 4) {
      if (selectedClasses.length === 0) {
        Alert.alert(t('error', language), t('oneClassRequired', language));
        setRollInput('');
        return;
      }

      // Check if already in absent list
      if (absentRecords.some(r => r.rollNo === cleanText)) {
        Alert.alert(t('notice', language), t('alreadyMarked', language));
        setRollInput('');
        return;
      }

      // Search in selected classes
      let foundStudent = null;
      let foundClass = null;

      for (const cls of selectedClasses) {
        const students = initialData.students?.[cls];
        if (students && students[cleanText]) {
          foundStudent = students[cleanText];
          foundClass = cls;
          break;
        }
      }

      if (foundStudent) {
        setAbsentRecords(prev => [{
          rollNo: cleanText,
          name: foundStudent,
          className: foundClass,
          timestamp: new Date().getTime()
        }, ...prev]);
        setRollInput('');
      } else {
        Alert.alert(t('error', language), t('noStudentFound', language));
        setRollInput('');
      }
    }
  };

  const removeRecord = (rollNo) => {
    setAbsentRecords(prev => prev.filter(r => r.rollNo !== rollNo));
  };

  const handleSubmit = async () => {
    if (selectedClasses.length === 0) {
      Alert.alert(t('error', language), t('oneClassRequired', language));
      return;
    }

    const teacher = await getSigleData('userName');
    const dateStr = date.toDateString();

    // Process each class
    for (const cls of selectedClasses) {
      const classStudents = initialData.students?.[cls] || {};
      const attendance = {};
      
      Object.keys(classStudents).forEach(roll => {
        // If student is in our absentRecords, they are FALSE, else TRUE
        const isAbsent = absentRecords.some(r => r.rollNo === roll && r.className === cls);
        attendance[roll] = !isAbsent;
      });

      await storePrayer({
        Teacher: teacher,
        Date: dateStr,
        Class: cls,
        Prayer: selectedPrayer,
        Attendance: attendance,
      });
    }

    Alert.alert(t('success', language), t('prayerSubmitted', language));
    router.back();
  };

  if (isLoading) return null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
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
          <Text className="text-white text-2xl font-bold">{t('quickMark', language)}</Text>
          <Text className="text-white/70 text-xs mt-1">{t('quickMarkSub', language)}</Text>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Date Picker Card */}
          <Animated.View entering={FadeInUp.delay(50).duration(600).springify()} className="px-5 mt-6">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('date', language)}</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
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
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Text className="text-text-sub text-xs mt-0.5">{date.getFullYear()}</Text>
              </View>
              <Ionicons name="calendar" size={20} color={primaryColor} />
            </TouchableOpacity>
            {showDatePicker && (
              <DatePickerCross
                mode="date"
                value={date}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                isDark={isDark}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </Animated.View>

          {/* Class Multi-Select */}
          <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-6">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-3 ml-1">{t('multiClassSelect', language)}</Text>
            <View className="flex-row flex-wrap gap-2">
              {initialData.classes?.map((cls) => {
                const isSelected = selectedClasses.includes(cls);
                return (
                  <TouchableOpacity
                    key={cls}
                    onPress={() => toggleClass(cls)}
                    style={{
                      backgroundColor: isSelected ? `${primaryColor}15` : (isDark ? '#1E293B' : '#F8FAFC'),
                      borderColor: isSelected ? primaryColor : 'transparent',
                      borderWidth: 1
                    }}
                    className="px-4 py-2.5 rounded-xl"
                  >
                    <Text className="text-xs font-semibold" style={{ color: isSelected ? primaryColor : (isDark ? '#94A3B8' : '#64748B') }}>{cls}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Prayer Select */}
          <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-6">
            <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-3 ml-1">{t('prayer', language)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {PRAYER_LIST.map((p) => {
                const isSelected = selectedPrayer === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setSelectedPrayer(p.key)}
                    className="items-center mr-4"
                  >
                    <View 
                      className="w-12 h-12 rounded-2xl items-center justify-center mb-1 border-2"
                      style={{ 
                        backgroundColor: isSelected ? `${p.color}15` : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderColor: isSelected ? p.color : 'transparent'
                      }}
                    >
                      {p.iconSet === 'material' 
                        ? <MaterialCommunityIcons name={p.icon} size={20} color={isSelected ? p.color : '#94A3B8'} />
                        : <Ionicons name={p.icon} size={20} color={isSelected ? p.color : '#94A3B8'} />
                      }
                    </View>
                    <Text className="text-[10px] font-bold" style={{ color: isSelected ? p.color : '#94A3B8' }}>{t(p.key, language)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Roll Number Input */}
          <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-8">
            <View className="bg-surface rounded-2xl p-6 border-2" style={{ borderColor: primaryColor }}>
              <Text className="text-text-main text-center font-bold text-lg mb-4">{t('enterIndexNumber', language)}</Text>
              <TextInput
                ref={inputRef}
                className="bg-background rounded-2xl p-4 text-center text-3xl font-bold tracking-[8px] text-text-main"
                placeholder="0000"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
                value={rollInput}
                onChangeText={handleRollInput}
                autoFocus={true}
              />
              <Text className="text-text-sub text-center text-xs mt-4 italic">{t('autoMarkMessage', language) || "Automatically marks student as ABSENT when 4 digits are typed"}</Text>
            </View>
          </Animated.View>

          {/* Absent List */}
          <View className="px-5 mt-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-text-main font-bold text-base">{t('markedAbsent', language)}</Text>
              <View className="bg-red-100 px-3 py-1 rounded-full">
                <Text className="text-red-600 font-bold text-xs">{absentRecords.length}</Text>
              </View>
            </View>
            
            {absentRecords.length > 0 ? (
              <View className="bg-surface rounded-2xl border border-slate-100 overflow-hidden">
                {absentRecords.map((item, index) => (
                  <Animated.View 
                    key={item.rollNo}
                    layout={Layout.springify()}
                    entering={FadeInDown}
                    className={`flex-row items-center p-4 ${index < absentRecords.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-3">
                      <Text className="text-red-600 font-bold text-xs">{item.rollNo}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-text-main font-bold text-sm">{item.name}</Text>
                      <Text className="text-text-sub text-[10px]">{item.className}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeRecord(item.rollNo)} className="p-2">
                      <Ionicons name="close-circle" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center border border-dashed border-slate-300">
                <Ionicons name="people-outline" size={32} color="#94A3B8" />
                <Text className="text-text-sub text-xs mt-2">{t('noAbsentsMarked', language) || "Everyone is marked as PRESENT by default"}</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View className="px-5 mt-10 mb-20">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={selectedClasses.length === 0}
              style={{ backgroundColor: selectedClasses.length > 0 ? primaryColor : '#94A3B8' }}
              className="rounded-2xl p-4 flex-row items-center justify-center shadow-lg"
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">{t('saveBulkAttendance', language)}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default QuickPrayer;
