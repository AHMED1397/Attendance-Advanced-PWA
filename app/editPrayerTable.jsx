import { View, Text, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import Checkbox from 'expo-checkbox';
import { getData, storeData, syncPrayerData } from '../services/asyncStorage';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';
import { Picker } from '@react-native-picker/picker';
import DatePickerCross from '../components/DatePickerCross';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'thahajjud', 'luha'];

const EditPrayerTable = () => {
  const params = useLocalSearchParams();
  const { Date: originalDate, Teacher, Class, Prayer: originalPrayer } = params;
  const [initialData, setInitialData] = useState({});
  const [Attendance, setAttendance] = useState(params.Attendance ? JSON.parse(params.Attendance) : {});
  const [editablePrayer, setEditablePrayer] = useState(originalPrayer);
  const [editableDate, setEditableDate] = useState(new Date(originalDate));
  const [showPrayerPicker, setShowPrayerPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  useEffect(() => {
    getData('initialData').then((res) => {
      setInitialData(res);
    });
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEditableDate(selectedDate);
    }
  };

  const TableRow = ({ value, index }) => {
    const rollNo = value.rollNo;
    const studentName = initialData?.students?.[Class]?.[rollNo] || "N/A";
    return (
      <View 
        className="flex-row items-center px-4 py-3.5"
        style={{ backgroundColor: index % 2 === 0 ? (isDark ? '#1E293B' : '#FFFFFF') : (isDark ? '#1A2332' : '#F8FAFC') }}
      >
        <Text className="w-[10%] text-center text-xs font-medium text-text-sub">{index + 1}</Text>
        <Text className="w-[25%] text-center text-xs font-semibold text-text-main">{rollNo}</Text>
        <Text className="w-[45%] text-xs text-text-main text-center" numberOfLines={1}>{studentName}</Text>
        <View className="w-[20%] items-center">
          <Checkbox
            value={value.attendance}
            onValueChange={(newValue) => handleAttendanceChange(rollNo, newValue)}
            color={value.attendance ? primaryColor : '#CBD5E1'}
            style={{ width: 22, height: 22, borderRadius: 6 }}
          />
        </View>
      </View>
    );
  };

  const handleAttendanceChange = (rollNo, newValue) => {
    setAttendance({ ...Attendance, [rollNo]: newValue });
  };

  const saveChanges = async () => {
    const newDateStr = editableDate.toDateString();
    
    const allData = await getData('prayerDetails');
    if (allData !== null) {
      // Remove the old record
      const filteredData = allData.filter(item => 
        !(item.Date === originalDate && item.Prayer === originalPrayer && item.Class === Class)
      );
      
      // Add the updated record
      const updatedRecord = { 
        Attendance, 
        Teacher: Teacher, 
        Date: newDateStr, 
        Prayer: editablePrayer, 
        Class, 
        synced: false 
      };
      
      const updatedData = [...filteredData, updatedRecord];
      await storeData(updatedData, "prayerDetails");
      await syncPrayerData(); // Syncs everything and marks synced=true if connected

      alert(t('changesSaved', language) || "Changes saved successfully!");
      router.back();
    }
  };

  const presentCount = Object.values(Attendance).filter(Boolean).length;
  const totalCount = Object.keys(Attendance).length;

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
        <Text className="text-white text-2xl font-bold">{t('edit', language)}: {Class}</Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="moon-outline" size={14} color="rgba(255,255,255,0.7)" />
          <TouchableOpacity onPress={() => setShowPrayerPicker(true)} className="flex-row items-center ml-1">
            <Text className="text-white/90 text-sm font-medium uppercase">{t(editablePrayer, language) || editablePrayer}</Text>
            <Ionicons name="pencil" size={12} color="rgba(255,255,255,0.6)" className="ml-1" />
          </TouchableOpacity>
          <View className="w-1 h-1 bg-white/40 rounded-full mx-3" />
          <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
          <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-row items-center ml-1">
            <Text className="text-white/90 text-sm font-medium">{new Date(editableDate).toLocaleDateString()}</Text>
            <Ionicons name="pencil" size={12} color="rgba(255,255,255,0.6)" className="ml-1" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="flex-row px-5 -mt-5 gap-3">
        {[
          { label: t("present", language), value: presentCount, color: "#10B981" },
          { label: t("absent", language), value: totalCount - presentCount, color: "#EF4444" },
          { label: t("total", language), value: totalCount, color: primaryColor },
        ].map((s, i) => (
          <View key={i} className="flex-1 bg-surface rounded-2xl p-3 items-center border border-slate-50 dark:border-slate-800"
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
            <Text className="text-lg font-bold" style={{ color: s.color }}>{s.value}</Text>
            <Text className="text-text-sub text-[10px] uppercase font-medium tracking-wider">{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Table */}
      <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} className="flex-1 px-5 mt-5">
        <View className="bg-surface rounded-2xl overflow-hidden border border-slate-50 dark:border-slate-800 flex-1"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
          <View className="flex-row px-4 py-3" style={{ backgroundColor: `${primaryColor}15` }}>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[10%] text-center uppercase">{t('no', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[25%] text-center uppercase">{t('index', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[45%] text-center uppercase">{t('name', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[20%] text-center uppercase">{t('present', language)}</Text>
          </View>

          <ScrollView className="flex-1">
            {Attendance && Object.entries(Attendance).length > 0 ? (
              Object.entries(Attendance).map(([rollNo, status], index) => (
                <TableRow key={index} value={{ rollNo, attendance: status }} index={index} />
              ))
            ) : (
              <View className="p-8 items-center">
                <Ionicons name="people-outline" size={32} color="#94A3B8" />
                <Text className="text-text-sub text-sm mt-2">{t('noAttendanceData', language)}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Save Button */}
      <Animated.View entering={FadeInUp.delay(300).duration(400)} className="px-5 py-4 pb-8">
        <TouchableOpacity
          onPress={saveChanges}
          style={{ backgroundColor: primaryColor }}
          className="rounded-2xl p-4 flex-row items-center justify-center"
          activeOpacity={0.85}
        >
          <Ionicons name="save" size={20} color="white" />
          <Text className="text-white font-bold text-base ml-2">{t('saveChanges', language)}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Prayer Picker Modal */}
      <Modal visible={showPrayerPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text-main font-bold text-lg">{language === 'ar' ? 'اختر الصلاة' : 'Select Prayer'}</Text>
              <TouchableOpacity onPress={() => setShowPrayerPicker(false)}>
                <Ionicons name="close" size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={editablePrayer}
              onValueChange={(value) => setEditablePrayer(value)}
              style={{ height: 200, color: isDark ? '#fff' : '#000' }}
            >
              {PRAYERS.map((prayer) => (
                <Picker.Item key={prayer} label={t(prayer, language)} value={prayer} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text-main font-bold text-lg">{t('selectDate', language)}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>
            <DatePickerCross
              value={editableDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              isDark={isDark}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={{ backgroundColor: primaryColor }}
                className="rounded-xl p-3 mt-2 items-center"
              >
                <Text className="text-white font-bold">{t('confirm', language)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditPrayerTable;
