import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import DatePickerCross from '../components/DatePickerCross';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getData, storeData, syncPrayerData } from '../services/asyncStorage';
import { readUserData } from '../services/firebase_crud';
import { useSettings } from '../services/SettingsContext';
import { t } from '../services/translations';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'thahajjud', 'luha'];
const PRAYER_COLORS = {
  fajr: '#F59E0B',
  dhuhr: '#EF4444',
  asr: '#F97316',
  maghrib: '#8B5CF6',
  isha: '#3B82F6',
  thahajjud: '#6366F1',
  luha: '#059669',
};
const PRAYER_ICONS = {
  fajr: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'cloudy-night-outline',
  isha: 'moon-outline',
  thahajjud: 'weather-night',
  luha: 'mosque',
};
const MATERIAL_ICONS = ['thahajjud', 'luha'];

export default function PrayerRecent() {
  const { primaryColor, language, theme } = useSettings();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [userName, setUserName] = useState(null);
  const [prayerDetails, setPrayerDetails] = useState([]);
  const [initialData, setInitialData] = useState(null);

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterPrayer, setFilterPrayer] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    fetchUserName();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (userName) fetchPrayerDetails(true);
  }, [userName]);

  const fetchUserName = async () => {
    const name = await getData("userName");
    if (name !== null) setUserName(name.name);
  };

  const fetchInitialData = async () => {
    const localData = await getData("initialData");
    if (localData) setInitialData(localData);
  };

  const fetchPrayerDetails = async (forceRefresh = false) => {
    const Details = await getData("prayerDetails");
    const netState = await NetInfo.fetch();

    if (forceRefresh || Details == null) {
      if (netState.isConnected) {
        await readUserData(`prayerDetails/${userName}`).then((res) => {
          if (res) {
            storeData(res, "prayerDetails");
            // Flatten if necessary (firebase might return object of keys instead of array)
            const arr = Array.isArray(res) ? res : Object.values(res);
            setPrayerDetails(arr);
          } else if (Details) {
            if (forceRefresh && !res) setPrayerDetails([]);
          }
        });
      } else {
        if (Details) {
            const arr = Array.isArray(Details) ? Details : Object.values(Details);
            setPrayerDetails(arr);
        }
        if (forceRefresh) Alert.alert(t("offline", language), t("offlineMsg", language));
      }
    } else {
      const arr = Array.isArray(Details) ? Details : Object.values(Details);
      setPrayerDetails(arr);
      if (netState.isConnected) {
        readUserData(`prayerDetails/${userName}`).then((res) => {
          if (res) {
            storeData(res, "prayerDetails");
            const arr2 = Array.isArray(res) ? res : Object.values(res);
            setPrayerDetails(arr2);
          }
        });
      }
    }
  };

  const applyFilters = () => setShowFilter(false);

  const clearFilters = () => {
    setFilterClass('');
    setFilterPrayer('');
    setFilterStartDate(null);
    setFilterEndDate(null);
    setShowFilter(false);
  };

  const getFilteredRecords = () => {
    let records = [...prayerDetails].reverse(); // newest first
    
    if (hasActiveFilters()) {
      if (filterClass) {
        records = records.filter(item => item.Class === filterClass);
      }
      if (filterPrayer) {
        records = records.filter(item => item.Prayer === filterPrayer);
      }
      if (filterStartDate) {
        const start = filterStartDate.getTime();
        records = records.filter(item => {
          const itemDate = new Date(item.Date).getTime();
          return itemDate >= start;
        });
      }
      if (filterEndDate) {
        const end = filterEndDate.getTime();
        records = records.filter(item => {
          const itemDate = new Date(item.Date).getTime();
          return itemDate <= end;
        });
      }
    } else {
      records = records.slice(0, 20); // only show last 20 if no filters
    }
    return records;
  };

  const hasActiveFilters = () => {
    return filterClass || filterPrayer || filterStartDate || filterEndDate;
  };

  const deleteRecord = (itemToDelete) => {
    Alert.alert(
      t('deleteRecord', language) || "Delete Record",
      t('deleteConfirm', language) || "Are you sure you want to delete this record?",
      [
        { text: t('cancel', language) || "Cancel", style: "cancel" },
        { 
          text: t('delete', language) || "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedDetails = prayerDetails.filter((item) => item !== itemToDelete);
              setPrayerDetails(updatedDetails);
              await storeData(updatedDetails, "prayerDetails");
              await syncPrayerData(); // sync deletion to firebase
            } catch (error) {
              console.error("Error deleting prayer record:", error);
              Alert.alert(t("error", language), t("errorDeleting", language));
            }
          }
        }
      ]
    );
  };

  const editor = (item) => {
    router.push({
      pathname: "/editPrayerTable",
      params: {
        Date: item.Date,
        Teacher: item.Teacher,
        Class: item.Class,
        Prayer: item.Prayer,
        Attendance: JSON.stringify(item.Attendance),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 py-4 flex-row items-center border-b border-slate-100 dark:border-slate-800 bg-surface">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <Ionicons name={language === 'ar' ? 'chevron-forward' : 'chevron-back'} size={24} color={isDark ? '#F8FAFC' : '#0F172A'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-main ml-4 flex-1">
          {t('recentDataCard', language)}
        </Text>
        <TouchableOpacity 
          onPress={() => setShowFilter(true)}
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border shadow-sm"
          style={{ borderColor: hasActiveFilters() ? primaryColor : (isDark ? '#1E293B' : '#F1F5F9') }}
        >
          <Ionicons name="filter" size={20} color={hasActiveFilters() ? primaryColor : (isDark ? '#F8FAFC' : '#64748B')} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {hasActiveFilters() && (
          <Animated.View entering={FadeInDown.duration(400)} className="mb-4">
            <Text className="text-text-sub text-xs font-semibold">
              {getFilteredRecords().length} {t("totalLabel", language)} (FILTERED)
            </Text>
          </Animated.View>
        )}

        {getFilteredRecords().length > 0 ? (
          getFilteredRecords().map((item, no) => {
            const prayer = item.Prayer;
            const pColor = PRAYER_COLORS[prayer] || primaryColor;
            const pIcon = PRAYER_ICONS[prayer] || 'moon-outline';
            const isMaterial = MATERIAL_ICONS.includes(prayer);

            return (
              <Animated.View
                key={no}
                entering={FadeInUp.delay(50 + no * 50).duration(400).springify()}
              >
                <View 
                  className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center border border-slate-50 dark:border-slate-800"
                  style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}
                >
                  <TouchableOpacity onPress={() => editor(item)} className="flex-1 flex-row items-center pr-2">
                    {/* Color indicator */}
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${pColor}12` }}
                    >
                      {isMaterial ? (
                        <MaterialCommunityIcons name={pIcon} size={18} color={pColor} />
                      ) : (
                        <Ionicons name={pIcon} size={18} color={pColor} />
                      )}
                    </View>
                    
                    <View className="flex-1 items-start">
                      <Text className="text-text-main font-semibold text-sm text-left" numberOfLines={1}>
                        {item.Class}
                      </Text>
                      <View className="flex-row items-center mt-1 w-full justify-start">
                        <View className="flex-row items-center mr-3">
                          <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: pColor, marginRight: 4}} />
                          <Text className="text-text-sub text-[11px] text-left capitalize">{t(prayer, language)}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
                          <Text className="text-text-sub ml-1 text-[11px] text-left">{item.Date}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => deleteRecord(item)}
                    className="w-9 h-9 rounded-xl items-center justify-center ml-2"
                    style={{ backgroundColor: '#FEF2F2' }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )
          })
        ) : (
          <View className="bg-surface rounded-2xl p-8 items-center border border-slate-50 dark:border-slate-800 mt-10">
            <View 
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <Ionicons name="documents-outline" size={28} color={primaryColor} />
            </View>
            <Text className="text-text-main font-semibold">
              {hasActiveFilters() ? t("noRecordsYet", language) : t("noRecordsYet", language)}
            </Text>
            <Text className="text-text-sub text-xs text-center mt-1">
              {hasActiveFilters() ? t("startMarking", language) : t("startMarkingPrayers", language)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Animated.View 
            entering={FadeInUp.duration(300)}
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: 34,
              maxHeight: '80%',
            }}
          >
            <View className="flex-row items-center justify-between px-5 py-4 border-b" style={{ borderColor: isDark ? '#334155' : '#E2E8F0' }}>
              <Text className="text-text-main text-lg font-bold">{language === 'ar' ? 'تصفية' : 'Filter'}</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Class Filter */}
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2">{t("class", language)}</Text>
              <View className="bg-surface rounded-xl border border-slate-100 dark:border-slate-700 mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}>
                <Picker
                  selectedValue={filterClass}
                  onValueChange={(value) => setFilterClass(value)}
                  style={{ height: 50, color: isDark ? '#fff' : '#000' }}
                >
                  <Picker.Item label={t("selectClass", language)} value="" />
                  {initialData?.classes?.map((cls, index) => (
                    <Picker.Item key={index} label={cls} value={cls} />
                  ))}
                </Picker>
              </View>

              {/* Prayer Filter */}
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2">{t("prayer", language)}</Text>
              <View className="bg-surface rounded-xl border border-slate-100 dark:border-slate-700 mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}>
                <Picker
                  selectedValue={filterPrayer}
                  onValueChange={(value) => setFilterPrayer(value)}
                  style={{ height: 50, color: isDark ? '#fff' : '#000' }}
                >
                  <Picker.Item label={language === 'ar' ? 'اختر الصلاة' : 'Select Prayer'} value="" />
                  {PRAYERS.map((prayer) => (
                    <Picker.Item key={prayer} label={t(prayer, language)} value={prayer} />
                  ))}
                </Picker>
              </View>

              {/* Date Range */}
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2">{language === 'ar' ? 'من تاريخ' : 'From Date'}</Text>
              <TouchableOpacity 
                onPress={() => setShowStartDatePicker(true)}
                className="bg-surface rounded-xl p-3 mb-4 flex-row items-center border border-slate-100 dark:border-slate-700"
              >
                <Ionicons name="calendar-outline" size={20} color={primaryColor} className="mr-2" />
                <Text className="text-text-main flex-1">
                  {filterStartDate ? filterStartDate.toLocaleDateString() : (language === 'ar' ? 'اختر التاريخ' : 'Select date')}
                </Text>
                {filterStartDate && (
                  <TouchableOpacity onPress={() => setFilterStartDate(null)}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2">{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</Text>
              <TouchableOpacity 
                onPress={() => setShowEndDatePicker(true)}
                className="bg-surface rounded-xl p-3 mb-4 flex-row items-center border border-slate-100 dark:border-slate-700"
              >
                <Ionicons name="calendar-outline" size={20} color={primaryColor} className="mr-2" />
                <Text className="text-text-main flex-1">
                  {filterEndDate ? filterEndDate.toLocaleDateString() : (language === 'ar' ? 'اختر التاريخ' : 'Select date')}
                </Text>
                {filterEndDate && (
                  <TouchableOpacity onPress={() => setFilterEndDate(null)}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* Filter Actions */}
            <View className="px-5 flex-row gap-3">
              <TouchableOpacity 
                onPress={clearFilters}
                className="flex-1 py-3 rounded-xl items-center border border-slate-200 dark:border-slate-700"
              >
                <Text className="text-text-sub font-semibold">{language === 'ar' ? 'مسح' : 'Clear'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={applyFilters}
                style={{ backgroundColor: primaryColor }}
                className="flex-1 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">{language === 'ar' ? 'تطبيق' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Start Date Picker */}
      {showStartDatePicker && (
        <DatePickerCross
          value={filterStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          isDark={isDark}
          onChange={(event, date) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (date) setFilterStartDate(date);
          }}
        />
      )}

      {/* End Date Picker */}
      {showEndDatePicker && (
        <DatePickerCross
          value={filterEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          isDark={isDark}
          onChange={(event, date) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (date) setFilterEndDate(date);
          }}
        />
      )}
    </SafeAreaView>
  );
}
