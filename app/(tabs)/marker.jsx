import { View, Text, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { getData } from '../../services/asyncStorage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useSettings } from '../../services/SettingsContext';
import { t } from '../../services/translations';

const Marker = () => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await getData('initialData');
      if (data !== null) {
        setClasses(data.classes);
        setSubjects(data.subjects);
      }
    };
    fetchInitialData();
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
    setShowPicker(false);
  };

  const detailsPasser = () => {
    if (className === '' || subject === '') {
      alert(t('pleaseFillForm', language));
      return;
    }
    router.push({
      pathname: '/attendanceTable',
      params: { date: date.toDateString(), className, subject },
    });
  };

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="px-5 pt-8 pb-2">
          <View className="flex-row items-center mb-1">
            <View 
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Ionicons name="create" size={20} color={primaryColor} />
            </View>
            <View>
              <Text className="text-2xl font-bold text-text-main">{t('markAttendance', language)}</Text>
              <Text className="text-text-sub text-xs mt-0.5">{t('selectClassDetails', language)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Date Picker Card */}
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
            <RNDateTimePicker
              mode="date"
              value={date}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
            />
          )}
        </Animated.View>

        {/* Class Selector Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-5">
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

        {/* Subject Selector Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-5">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('subject', language)}</Text>
          <View 
            className="bg-surface rounded-2xl border border-slate-50 overflow-hidden"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
          >
            <View className="flex-row items-center px-4">
              <View 
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Ionicons name="book" size={16} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Picker
                  selectedValue={subject}
                  onValueChange={(itemValue) => setSubject(itemValue)}
                  style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                >
                  <Picker.Item label={t('selectSubject', language)} value="" color="#94A3B8" />
                  {subjects.map((item, index) => (
                    <Picker.Item key={index} label={item} value={item} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} className="px-5 mt-8">
          <TouchableOpacity
            style={{ backgroundColor: primaryColor }}
            className="rounded-2xl p-4 flex-row items-center justify-center"
            onPress={detailsPasser}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base mr-2">{t('continue', language)}</Text>
            <Ionicons name={language === 'ar' ? "arrow-back" : "arrow-forward"} size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Marker;