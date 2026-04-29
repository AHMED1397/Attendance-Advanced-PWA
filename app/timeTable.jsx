import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { getData, storeData } from '../services/asyncStorage';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';

const periods = 8;
const subjects = ['Math', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Free Period'];
const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'];

const TimetableScreen = () => {
  const [timetable, setTimetable] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const dayKeys = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const days = dayKeys.map(k => t(k, language));

  useEffect(() => { loadTimetable(); }, []);

  const loadTimetable = async () => {
    try {
      const storedData = await getData('school_timetable');
      if (storedData) setTimetable(JSON.parse(storedData));
    } catch (error) {
      Alert.alert(t('error', language), t('timetableLoadError', language));
    }
  };

  const saveTimetable = async () => {
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      for (let j = 1; j <= periods; j++) {
        if (!timetable[day]?.[j]?.subject || !timetable[day]?.[j]?.class) {
          Alert.alert(t('error', language), `${t('selectSubjectAndClass', language)} ${day}, ${t('period', language)} ${j}`);
          return;
        }
      }
    }
    try {
      await storeData(JSON.stringify(timetable), 'school_timetable');
      Alert.alert(t('success', language), t('timetableSaved', language));
    } catch (error) {
      Alert.alert(t('error', language), t('timetableSaveError', language));
    }
  };

  const handleInputChange = (day, period, key, value) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [period]: {
          ...(prev[day]?.[period] || {}),
          [key]: value,
        },
      },
    }));
  };

  const dayIcons = {
    0: 'sunny', 1: 'sunny-outline', 2: 'calendar',
    3: 'calendar-outline', 4: 'calendar', 5: 'calendar-outline'
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(600).springify()}
        style={{ backgroundColor: primaryColor }}
        className="rounded-b-[32px] px-5 pt-14 pb-6"
      >
        <Text className="text-white text-2xl font-bold">{t('timetable', language)}</Text>
        <Text className="text-white/70 text-sm mt-1">{t('manageSchedule', language)}</Text>
      </Animated.View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {days.map((day, dayIdx) => (
          <Animated.View 
            key={day} 
            entering={FadeInUp.delay(100 + dayIdx * 80).duration(500).springify()}
          >
            <TouchableOpacity 
              onPress={() => setExpandedDay(expandedDay === day ? null : day)}
              className="bg-surface rounded-2xl mb-3 border border-slate-50 overflow-hidden"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${primaryColor}15` }}>
                    <Ionicons name={dayIcons[dayIdx] || 'calendar'} size={18} color={primaryColor} />
                  </View>
                  <View>
                    <Text className="text-text-main font-bold text-base">{day}</Text>
                    <Text className="text-text-sub text-[10px]">{periods} {t('periods', language)}</Text>
                  </View>
                </View>
                <Ionicons 
                  name={expandedDay === day ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#94A3B8" 
                />
              </View>

              {expandedDay === day && (
                <View className="px-4 pb-4">
                  {Array.from({ length: periods }, (_, i) => (
                    <View key={i} className="mb-3 bg-background rounded-xl p-3 border border-slate-50">
                      <Text className="text-text-sub text-[10px] font-semibold uppercase tracking-wider mb-2">
                        {t('period', language)} {i + 1}
                      </Text>
                      <View className="bg-surface rounded-lg overflow-hidden mb-1.5 border border-slate-50">
                        <Picker
                          selectedValue={timetable[day]?.[i + 1]?.subject || ''}
                          onValueChange={(value) => handleInputChange(day, i + 1, 'subject', value)}
                          style={{ color: isDark ? '#F8FAFC' : '#0F172A', height: 44 }}
                        >
                          <Picker.Item label={t('subject', language)} value="" color="#94A3B8" />
                          {subjects.map((sub) => (
                            <Picker.Item key={sub} label={sub} value={sub} />
                          ))}
                        </Picker>
                      </View>
                      <View className="bg-surface rounded-lg overflow-hidden border border-slate-50">
                        <Picker
                          selectedValue={timetable[day]?.[i + 1]?.class || ''}
                          onValueChange={(value) => handleInputChange(day, i + 1, 'class', value)}
                          style={{ color: isDark ? '#F8FAFC' : '#0F172A', height: 44 }}
                        >
                          <Picker.Item label={t('class', language)} value="" color="#94A3B8" />
                          {classes.map((cls) => (
                            <Picker.Item key={cls} label={cls} value={cls} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <TouchableOpacity 
            onPress={saveTimetable}
            style={{ backgroundColor: primaryColor }}
            className="rounded-2xl p-4 flex-row items-center justify-center mt-3"
            activeOpacity={0.85}
          >
            <Ionicons name="save" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">{t('saveTimetable', language)}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default TimetableScreen;
