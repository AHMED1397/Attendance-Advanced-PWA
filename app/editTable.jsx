import { View, Text, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import Checkbox from 'expo-checkbox';
import { getData, storeData, updateinFB } from '../services/asyncStorage';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';
import { Picker } from '@react-native-picker/picker';
import RNDateTimePicker from '@react-native-community/datetimepicker';

const EditTable = () => {
  const params = useLocalSearchParams();
  const { Date: originalDate, Teacher, Class, Subject: originalSubject } = params;
  const [initialData, setInitialData] = useState({});
  const [Attendance, setAttendance] = useState(params.Attendance ? JSON.parse(params.Attendance) : {});
  const [subjects, setSubjects] = useState([]);
  const [editableSubject, setEditableSubject] = useState(originalSubject);
  const [editableDate, setEditableDate] = useState(new Date(originalDate));
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  useEffect(() => {
    getData('initialData').then((res) => {
      setInitialData(res);
      if (res?.subjects) setSubjects(res.subjects);
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
        <Text className="w-[20%] text-center text-xs font-semibold text-text-main">{rollNo}</Text>
        <Text className="w-[45%] text-xs text-text-main text-center" numberOfLines={1}>{studentName}</Text>
        <View className="w-[25%] items-center">
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
    const hasChanged = newDateStr !== originalDate || editableSubject !== originalSubject;
    
    if (hasChanged) {
      const allData = await getData('attendanceDetails');
      if (allData !== null) {
        const filteredData = allData.filter(item => 
          !(item.Date === originalDate && item.Subject === originalSubject && item.Class === Class)
        );
        const newRecord = { Attendance, Teacher: Attendance.Teacher || Teacher, Date: newDateStr, Subject: editableSubject, Class, synced: false };
        const updatedData = [...filteredData, newRecord];
        await storeData(updatedData, "attendanceDetails");
        const teacherName = JSON.parse(Teacher).name;
        updateinFB(teacherName, updatedData.length - 1, newRecord);
        alert(t('changesSaved', language));
        router.navigate("/(tabs)");
      }
    } else {
      const updatedAttendance = { Attendance, Teacher, Date: originalDate, Subject: editableSubject, Class };
      getData('attendanceDetails').then((res) => {
        var id = null;
        if (res !== null) {
          const updatedData = res.map((item, index) => {
            if (item.Date === originalDate && item.Subject === originalSubject && item.Class === Class) {
              id = index;
              return updatedAttendance;
            }
            return item;
          });
          storeData(updatedData, "attendanceDetails", id, updatedAttendance);
          updateinFB(JSON.parse(updatedAttendance.Teacher).name, id, updatedAttendance);
          alert(t('changesSaved', language));
          router.navigate("/(tabs)");
        }
      });
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
          <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
          <TouchableOpacity onPress={() => setShowSubjectPicker(true)} className="flex-row items-center ml-1">
            <Text className="text-white/90 text-sm font-medium">{editableSubject}</Text>
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
          <View className="flex-row px-4 py-3" style={{ backgroundColor: `${primaryColor}15` }}>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[10%] text-center uppercase">{t('no', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[20%] text-center uppercase">{t('index', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[45%] text-center uppercase">{t('name', language)}</Text>
            <Text style={{ color: primaryColor }} className="text-[10px] font-bold w-[25%] text-center uppercase">{t('present', language)}</Text>
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

      {/* Subject Picker Modal */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text-main font-bold text-lg">{t('selectSubject', language)}</Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={editableSubject}
              onValueChange={(value) => setEditableSubject(value)}
              style={{ height: 200 }}
            >
              {subjects.map((sub, index) => (
                <Picker.Item key={index} label={sub} value={sub} />
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
            <RNDateTimePicker
              value={editableDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
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

export default EditTable;