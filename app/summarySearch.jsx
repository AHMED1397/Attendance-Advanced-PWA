import { View, Text, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker'
import { getData } from '../services/asyncStorage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';

const SummarySearch = () => {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';
  const router = useRouter();

  useEffect(() => {
    getData('initialData').then(data => {
      if (data) { setClasses(data.classes); setSubjects(data.subjects); }
    });
  }, []);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const DateChip = ({ label, date, onPress }) => (
    <TouchableOpacity onPress={onPress} className="flex-1 bg-surface rounded-2xl p-4 border border-slate-50"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }} activeOpacity={0.7}>
      <Text className="text-text-sub text-[10px] font-semibold uppercase tracking-wider mb-2">{label}</Text>
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}15` }}>
          <Text style={{ color: primaryColor }} className="text-sm font-bold">{date.getDate()}</Text>
        </View>
        <View>
          <Text className="text-text-main font-semibold text-sm">{months[date.getMonth()]} {date.getDate()}</Text>
          <Text className="text-text-sub text-[10px] mt-0.5">{date.getFullYear()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <Animated.View entering={FadeInDown.duration(600).springify()} style={{ backgroundColor: primaryColor }} className="rounded-b-[32px] px-5 pt-14 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="arrow-back" size={20} color="white" /><Text className="text-white/70 text-sm ml-2">{t('back', language)}</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{t('summarySearch', language)}</Text>
        <Text className="text-white/70 text-sm mt-1">{t('filterByClassSubject', language)}</Text>
      </Animated.View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-5">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('class', language)}</Text>
          <View className="bg-surface rounded-2xl border border-slate-50 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
            <View className="flex-row items-center px-4">
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}15` }}>
                <Ionicons name="school" size={16} color={primaryColor} /></View>
              <View className="flex-1">
                <Picker selectedValue={className} onValueChange={v => setClassName(v)} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  <Picker.Item label={t('selectClass', language)} value="" color="#94A3B8" />{classes.map((item, i) => <Picker.Item key={i} label={item} value={item} />)}
                </Picker></View></View></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="px-5 mt-5">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('subject', language)}</Text>
          <View className="bg-surface rounded-2xl border border-slate-50 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
            <View className="flex-row items-center px-4">
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}15` }}>
                <Ionicons name="book" size={16} color={primaryColor} /></View>
              <View className="flex-1">
                <Picker selectedValue={subject} onValueChange={v => setSubject(v)} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  <Picker.Item label={t('selectSubject', language)} value="" color="#94A3B8" />{subjects.map((item, i) => <Picker.Item key={i} label={item} value={item} />)}
                </Picker></View></View></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-5 mt-5">
          <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">{t('dateRange', language)}</Text>
          <View className="flex-row gap-3">
            <DateChip label={t('from', language)} date={fromDate} onPress={() => setShowFromPicker(true)} />
            <DateChip label={t('to', language)} date={toDate} onPress={() => setShowToPicker(true)} />
          </View>
          {showFromPicker && <RNDateTimePicker mode="date" value={fromDate} display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(e, d) => { if (d) setFromDate(d); setShowFromPicker(false); }} />}
          {showToPicker && <RNDateTimePicker mode="date" value={toDate} display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(e, d) => { if (d) setToDate(d); setShowToPicker(false); }} />}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} className="px-5 mt-8">
          <TouchableOpacity style={{ backgroundColor: primaryColor }} className="rounded-2xl p-4 flex-row items-center justify-center" activeOpacity={0.85}
            onPress={() => {
              if (!className || !subject) { alert(t('pleaseSelectAll', language)); return; }
              router.push({ pathname: '/summaryTable', params: { fromDate: fromDate.toDateString(), toDate: toDate.toDateString(), className, subject } });
            }}>
            <Ionicons name="search" size={18} color="white" /><Text className="text-white font-bold text-base ml-2">{t('searchSummary', language)}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default SummarySearch;
