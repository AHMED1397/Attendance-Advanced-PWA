import { View, Text, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { getData } from '../../services/asyncStorage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useSettings } from '../../services/SettingsContext';
import { t } from '../../services/translations';

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

const Prayer = () => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [className, setClassName] = useState('');
  const [selectedPrayer, setSelectedPrayer] = useState('');
  const [classes, setClasses] = useState([]);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await getData('initialData');
      if (data !== null) {
        setClasses(data.classes);
      }
    };
    fetchInitialData();
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
    setShowPicker(false);
  };

  const goToMarkPrayers = () => {
    if (className === '' || selectedPrayer === '') {
      alert(t('pleaseFillForm', language));
      return;
    }
    router.push({
      pathname: '/prayerTable',
      params: { date: date.toDateString(), className, prayer: selectedPrayer },
    });
  };

  const goToAnalytics = () => {
    if (className === '') {
      alert(t('pleaseFillForm', language));
      return;
    }
    router.push({
      pathname: '/prayerAnalytics',
      params: { className },
    });
  };

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const selectedPrayerData = PRAYER_LIST.find(p => p.key === selectedPrayer);

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
              <MaterialCommunityIcons name="mosque" size={20} color={primaryColor} />
            </View>
            <View>
              <Text className="text-2xl font-bold text-text-main">{t('markPrayers', language)}</Text>
              <Text className="text-text-sub text-xs mt-0.5">{t('selectClassForPrayer', language)}</Text>
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

        {/* Prayer Selector */}
        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-5">
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

        {/* CTA Buttons */}
        <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} className="px-5 mt-8">
          <TouchableOpacity
            style={{ backgroundColor: selectedPrayerData ? selectedPrayerData.color : primaryColor }}
            className="rounded-2xl p-4 flex-row items-center justify-center mb-3"
            onPress={goToMarkPrayers}
            activeOpacity={0.85}
          >
            <Ionicons name="checkbox-outline" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              {selectedPrayer ? `${t('mark', language)} ${t(selectedPrayer, language)}` : t('markPrayers', language)}
            </Text>
            <View className="flex-1" />
            <Ionicons name={language === 'ar' ? "arrow-back" : "arrow-forward"} size={18} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl p-4 flex-row items-center justify-center border-2"
            style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
            onPress={goToAnalytics}
            activeOpacity={0.85}
          >
            <Ionicons name="bar-chart-outline" size={20} color={primaryColor} />
            <Text style={{ color: primaryColor }} className="font-bold text-base ml-2">{t('viewAnalytics', language)}</Text>
            <View className="flex-1" />
            <Ionicons name={language === 'ar' ? "arrow-back" : "arrow-forward"} size={18} color={primaryColor} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Prayer;
