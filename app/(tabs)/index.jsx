import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";
import { getData, storeData, getPendingCount, syncData, syncPrayerData, storeSingleData, getSigleData } from "../../services/asyncStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { readUserData } from "../../services/firebase_crud";
import { useSettings } from "../../services/SettingsContext";
import { t } from "../../services/translations";
import { Picker } from "@react-native-picker/picker";
import { seedQadrPlans } from "../../services/seedQadrPlans";
import { fetchQadrConfig, calculateProgress, fetchAllQadrPlans } from "../../services/qadrConfig";
import DatePickerCross from "../../components/DatePickerCross";

const Index = () => {
  const [date, setDate] = useState(new Date());
  const [userName, setUserName] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // What's New modal
  const CURRENT_VERSION = '1.3.0';
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Qadr Progress states
  const [showQadrProgress, setShowQadrProgress] = useState(false);
  const [qadrSelectedClass, setQadrSelectedClass] = useState('');
  const [qadrSelectedSubject, setQadrSelectedSubject] = useState('');
  const [qadrProgressData, setQadrProgressData] = useState(null);
  const [qadrAvailableSubjects, setQadrAvailableSubjects] = useState([]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!qadrSelectedClass) {
        setQadrAvailableSubjects([]);
        return;
      }
      const plans = await fetchAllQadrPlans();
      if (!plans) {
        setQadrAvailableSubjects([]);
        return;
      }
      
      let classPlans = plans[qadrSelectedClass];
      if (!classPlans) {
        const norm = (s) => s.replace(/\s+/g, '').replace(/-/g, '');
        const normInput = norm(qadrSelectedClass);
        for (const key of Object.keys(plans)) {
          if (norm(key) === normInput) {
            classPlans = plans[key];
            break;
          }
        }
      }
      
      if (classPlans) {
        setQadrAvailableSubjects(Object.keys(classPlans));
      } else {
        setQadrAvailableSubjects([]);
      }
    };
    if (showQadrProgress) {
        loadSubjects();
    }
  }, [qadrSelectedClass, showQadrProgress]);

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const checkWhatsNew = async () => {
      try {
        const seenVersion = await AsyncStorage.getItem('whatsNewSeen');
        if (seenVersion !== CURRENT_VERSION) {
          setShowWhatsNew(true);
        }
      } catch (e) {}
    };
    checkWhatsNew();
  }, []);

  const dismissWhatsNew = async () => {
    setShowWhatsNew(false);
    try {
      await AsyncStorage.setItem('whatsNewSeen', CURRENT_VERSION);
    } catch (e) {}
  };

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const router = useRouter();

  const fetchUserName = async () => {
    const name = await getData("userName");
    if (name !== null) setUserName(name.name);
  };

  const fetchInitialData = async () => {
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      readUserData("initialData").then((res) => {
        if (res) {
          storeData(res, "initialData");
          setInitialData(res);
        }
      }).catch(err => console.error(err));
    } else {
      const localData = await getData("initialData");
      if (localData) setInitialData(localData);
    }
  };

  const fetchAttendanceDetails = async (forceRefresh = false) => {
    const Details = await getData("attendanceDetails");
    const netState = await NetInfo.fetch();

    if (forceRefresh || Details == null) {
      if (netState.isConnected) {
        await readUserData(`attendanceDetails/${userName}`).then((res) => {
          if (res) {
            storeData(res, "attendanceDetails");
            setAttendanceDetails(res);
          } else if (Details) {
            if (forceRefresh && !res) setAttendanceDetails([]);
          }
        });
      } else {
        if (Details) setAttendanceDetails(Details);
        if (forceRefresh) Alert.alert(t("offline", language), t("offlineMsg", language));
      }
    } else {
      setAttendanceDetails(Details);
      if (netState.isConnected) {
        readUserData(`attendanceDetails/${userName}`).then((res) => {
          if (res) {
            storeData(res, "attendanceDetails");
            setAttendanceDetails(res);
          }
        });
      }
    }
  };

  const applyFilters = () => {
    setShowFilter(false);
  };

  const clearFilters = () => {
    setFilterClass('');
    setFilterSubject('');
    setFilterStartDate(null);
    setFilterEndDate(null);
    setShowFilter(false);
  };

  const getFilteredRecords = () => {
    let records = [...attendanceDetails].reverse();
    
    if (hasActiveFilters()) {
      if (filterClass) {
        records = records.filter(item => item.Class === filterClass);
      }
      if (filterSubject) {
        records = records.filter(item => item.Subject === filterSubject);
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
      records = records.slice(0, 20);
    }
    
    return records;
  };

  const hasActiveFilters = () => {
    return filterClass || filterSubject || filterStartDate || filterEndDate;
  };

  useEffect(() => {
    fetchUserName();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (userName) fetchAttendanceDetails(true);
  }, [userName]);

  const editor = (item) => {
    router.push({
      pathname: "/editTable",
      params: {
        Date: item.Date,
        Teacher: item.Teacher,
        Class: item.Class,
        Subject: item.Subject,
        Attendance: JSON.stringify(item.Attendance),
      },
    });
  };

  const deleteRecord = (itemToDelete) => {
    console.log("deleteRecord called with:", itemToDelete);
    setDeleteItem(itemToDelete);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    console.log("Delete confirmed for:", deleteItem);
    try {
      const updatedDetails = attendanceDetails.filter((item) => item !== deleteItem);
      setAttendanceDetails(updatedDetails);
      await storeData(updatedDetails, "attendanceDetails");
      await syncData();
      console.log("Delete successful");
    } catch (error) {
      console.error("Error deleting record:", error);
      Alert.alert(t("error", language) || "Error", t("errorDeleting", language) || "Error deleting record");
    }
    setDeleteItem(null);
  };

  const cancelDelete = () => {
    console.log("Delete cancelled");
    setDeleteItem(null);
  };

  const getGreeting = () => {
    const hour = date.getHours();
    if (hour < 12) return t("goodMorning", language);
    if (hour < 18) return t("goodAfternoon", language);
    return t("goodEvening", language);
  };

  const getGreetingIcon = () => {
    const hour = date.getHours();
    if (hour < 12) return "sunny-outline";
    if (hour < 18) return "partly-sunny-outline";
    return "moon-outline";
  };

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(null);

  useEffect(() => {
    const quotes = [
      { text: "خيركم من تعلم القرآن وعلمه", source: "رواه البخاري" },
      { text: "إن الله وملائكته وأهل السماوات والأرضين ليصلون على معلم الناس الخير", source: "رواه الترمذي" },
      { text: "فضل العالم على العابد كفضلي على أدناكم", source: "رواه الترمذي" },
      { text: "من سلك طريقا يلتمس فيه علما سهل الله له به طريقا إلى الجنة", source: "رواه مسلم" },
      { text: "إذا مات ابن آدم انقطع عمله إلا من ثلاث: صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له", source: "رواه مسلم" },
      { text: "إنما بعثت معلماً", source: "رواه ابن ماجه" }
    ];
    setDailyQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) performSync();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [attendanceDetails]);

  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const performSync = async () => {
    setIsSyncing(true);
    await syncData();
    await syncPrayerData();
    const updatedData = await getData("attendanceDetails");
    if (updatedData) setAttendanceDetails(updatedData);
    setIsSyncing(false);
  };

  const totalRecords = Array.isArray(attendanceDetails) ? attendanceDetails.length : 0;
  const syncedRecords = totalRecords - pendingCount;

  return (
    <>
      <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Header */}
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
          className="px-5 pt-4 pb-2"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View 
                className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-white text-lg font-bold">
                  {userName ? userName.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Ionicons name={getGreetingIcon()} size={14} color={primaryColor} />
                  <Text className="text-text-sub text-xs ml-1 font-medium">{getGreeting()}</Text>
                </View>
                <Text className="text-text-main text-lg font-bold" numberOfLines={1}>
                  {userName || t("loading", language)} 
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => { fetchAttendanceDetails(true); fetchInitialData(); }} 
              className="w-10 h-10 rounded-xl bg-surface border border-slate-100 items-center justify-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <Ionicons name="refresh" size={18} color={primaryColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Faleelathu Thaleem Quote */}
        {dailyQuote && (
          <Animated.View entering={FadeInUp.delay(50).duration(600).springify()} className="px-5 mt-4">
            <View 
              className="rounded-2xl p-4 flex-row items-center border"
              style={{ 
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 
              }}
            >
              <View className="flex-1 mr-3 items-center">
                <Text className="text-text-main font-bold text-[14px] text-center leading-5" style={{ writingDirection: 'rtl' }}>
                  {dailyQuote.text}
                </Text>
                <Text className="text-text-sub text-[10px] mt-1.5 font-medium text-center" style={{ writingDirection: 'rtl' }}>
                  {dailyQuote.source}
                </Text>
              </View>
              <View 
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <MaterialCommunityIcons name="book-open-page-variant" size={20} color={primaryColor} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Sync Status Pill */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} className="px-5 mt-4">
          <TouchableOpacity 
            onPress={pendingCount > 0 ? performSync : undefined}
            activeOpacity={pendingCount > 0 ? 0.7 : 1}
            className="flex-row items-center justify-between rounded-2xl px-4 py-2.5"
            style={{ backgroundColor: pendingCount > 0 ? '#FFF7ED' : (isDark ? '#064E3B' : '#ECFDF5') }}
          >
            <View className="flex-row items-center">
              <View 
                className="w-7 h-7 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: pendingCount > 0 ? '#FFEDD5' : (isDark ? '#065F46' : '#D1FAE5') }}
              >
                <MaterialIcons 
                  name={pendingCount > 0 ? "cloud-off" : "cloud-done"} 
                  size={14} 
                  color={pendingCount > 0 ? "#F97316" : "#10B981"} 
                />
              </View>
              <Text 
                className="text-xs font-semibold"
                style={{ color: pendingCount > 0 ? '#9A3412' : '#065F46' }}
              >
                {pendingCount > 0 
                  ? `${pendingCount} ${pendingCount !== 1 ? t("unsyncedRecords", language) : t("unsyncedRecord", language)}`
                  : t("allRecordsSynced", language)}
              </Text>
            </View>
            {pendingCount > 0 && (
              isSyncing 
                ? <Text style={{ color: '#EA580C' }} className="text-[10px] font-medium">{t("syncing", language)}</Text>
                : <Text style={{ color: '#EA580C' }} className="text-[10px] font-bold">{t("tapToSync", language)}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Compact Stats Row */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600).springify()}
          className="px-5 mt-4"
        >
          <View 
            className="bg-surface rounded-2xl px-4 py-3 flex-row items-center justify-between border border-slate-50"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
          >
            {[
              { label: t("total", language), value: totalRecords, icon: "document-text-outline", color: primaryColor },
              { label: t("synced", language), value: syncedRecords, icon: "cloud-done-outline", color: "#10B981" },
              { label: t("pending", language), value: pendingCount, icon: "time-outline", color: "#F59E0B" },
            ].map((stat, idx) => (
              <View key={idx} className="flex-row items-center">
                {idx > 0 && <View className="w-px h-6 bg-slate-100 mr-3" />}
                <View 
                  className="w-7 h-7 rounded-lg items-center justify-center mr-2"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Ionicons name={stat.icon} size={13} color={stat.color} />
                </View>
                <View>
                  <Text className="text-text-main text-sm font-bold">{stat.value}</Text>
                  <Text className="text-text-sub text-[9px] font-medium uppercase tracking-wider">{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Lessons Held Per Subject */}
        {totalRecords > 0 && (
        <Animated.View 
          entering={FadeInUp.delay(250).duration(600).springify()}
          className="px-5 mt-3"
        >
          <View 
            className="bg-surface rounded-2xl p-4 border border-slate-50"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
          >
            <View className="flex-row items-center mb-3">
              <View 
                className="w-8 h-8 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Ionicons name="book-outline" size={14} color={primaryColor} />
              </View>
              <Text className="text-text-main text-sm font-bold flex-1">{t("lessonsHeld", language)}</Text>
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${primaryColor}12` }}>
                <Text style={{ color: primaryColor }} className="text-[10px] font-bold">{totalRecords} {t("totalLabel", language)}</Text>
              </View>
            </View>
            {(() => {
              const subjectCounts = {};
              if (Array.isArray(attendanceDetails)) {
                attendanceDetails.forEach(item => {
                  const subj = item.Subject || 'Unknown';
                  subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
                });
              }
              const subjectColors = [primaryColor, '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#14B8A6'];
              return Object.entries(subjectCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([subject, count], idx) => (
                  <View key={subject} className="flex-row items-center py-2" style={idx > 0 ? { borderTopWidth: 1, borderTopColor: '#F1F5F9' } : {}}>
                    <View 
                      className="w-6 h-6 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: `${subjectColors[idx % subjectColors.length]}15` }}
                    >
                      <Ionicons name="school" size={11} color={subjectColors[idx % subjectColors.length]} />
                    </View>
                    <Text className="text-text-main text-xs font-medium flex-1" numberOfLines={1}>{subject}</Text>
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${subjectColors[idx % subjectColors.length]}12` }}>
                      <Text className="text-[10px] font-bold" style={{ color: subjectColors[idx % subjectColors.length] }}>{count} {count !== 1 ? t("lessons", language) : t("lesson", language)}</Text>
                    </View>
                  </View>
                ));
            })()}
          </View>
        </Animated.View>
        )}

        {/* Date Badge */}
        <Animated.View 
          entering={FadeInUp.delay(300).duration(600).springify()}
          className="px-5 mt-5"
        >
          <View 
            className="bg-surface rounded-2xl p-4 flex-row items-center border border-slate-50"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
          >
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Text style={{ color: primaryColor }} className="text-2xl font-bold">{date.getDate()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-main text-base font-semibold">{days[date.getDay()]}</Text>
              <Text className="text-text-sub text-xs mt-0.5">{months[date.getMonth()]} {date.getFullYear()}</Text>
            </View>
            <View 
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${primaryColor}12` }}
            >
              <Text style={{ color: primaryColor }} className="text-[10px] font-bold uppercase">{t("today", language)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Qadr Progress Button */}
        <Animated.View entering={FadeInUp.delay(350).duration(600).springify()} className="px-5 mt-4">
          <TouchableOpacity 
            onPress={() => {
              if (initialData?.classes) {
                setQadrSelectedClass('');
                setQadrSelectedSubject('');
                setQadrProgressData(null);
                setShowQadrProgress(true);
              } else {
                Alert.alert(t("error", language), t("noDataAvailable", language) || "No data available");
              }
            }}
            className="flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <MaterialCommunityIcons name="book-open-page-variant" size={18} color={primaryColor} style={{ marginRight: 8 }} />
            <Text style={{ color: primaryColor }} className="text-sm font-semibold">{t("qadrProgress", language) || "مقرر"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Records */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(600).springify()}
          className="px-5 mt-6"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-text-main text-base font-bold">{t("recentRecords", language)}</Text>
              {hasActiveFilters() && (
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Text style={{ color: primaryColor }} className="text-[10px] font-bold">FILTERED</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center">
              <Text className="text-text-sub text-xs mr-2">{getFilteredRecords().length} {t("totalLabel", language)}</Text>
              <TouchableOpacity 
                onPress={() => setShowFilter(true)}
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: hasActiveFilters() ? `${primaryColor}20` : '#F1F5F9' }}
              >
                <Ionicons name="filter" size={16} color={hasActiveFilters() ? primaryColor : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>

          {getFilteredRecords().length > 0 ? (
            getFilteredRecords().map((item, no) => (
              <Animated.View
                key={no}
                entering={FadeInUp.delay(450 + no * 50).duration(400).springify()}
              >
                <View 
                  className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center border border-slate-50"
                  style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}
                >
                  <TouchableOpacity onPress={() => editor(item)} className="flex-1 flex-row items-center pr-2">
                    {/* Color indicator */}
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${primaryColor}12` }}
                    >
                      <Ionicons name="school" size={18} color={primaryColor} />
                    </View>
                    
                    <View className="flex-1 items-start">
                      <Text className="text-text-main font-semibold text-sm text-left" numberOfLines={1}>
                        {item.Class}
                      </Text>
                      <View className="flex-row items-center mt-1 w-full justify-start">
                        <View className="flex-row items-center mr-3">
                          <Ionicons name="book-outline" size={11} color="#94A3B8" />
                          <Text className="text-text-sub ml-1 text-[11px] text-left">{item.Subject}</Text>
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
                    onPressIn={() => console.log("Delete pressed!")}
                    className="w-9 h-9 rounded-xl items-center justify-center ml-2"
                    style={{ backgroundColor: '#FEF2F2' }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))
          ) : (
            <View className="bg-surface rounded-2xl p-8 items-center border border-slate-50">
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
                {hasActiveFilters() ? t("startMarking", language) : t("startMarking", language)}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>

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
              <View className="bg-surface rounded-xl border border-slate-100 mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}>
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

              {/* Subject Filter */}
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2">{t("subject", language)}</Text>
              <View className="bg-surface rounded-xl border border-slate-100 mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}>
                <Picker
                  selectedValue={filterSubject}
                  onValueChange={(value) => setFilterSubject(value)}
                  style={{ height: 50, color: isDark ? '#fff' : '#000' }}
                >
                  <Picker.Item label={t("selectSubject", language)} value="" />
                  {initialData?.subjects?.map((sub, index) => (
                    <Picker.Item key={index} label={sub} value={sub} />
                  ))}
                </Picker>
              </View>

              {/* Date Range */}
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2">{language === 'ar' ? 'من تاريخ' : 'From Date'}</Text>
              <TouchableOpacity 
                onPress={() => setShowStartDatePicker(true)}
                className="bg-surface rounded-xl p-3 mb-4 flex-row items-center border border-slate-100"
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
                className="bg-surface rounded-xl p-3 mb-4 flex-row items-center border border-slate-100"
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
                className="flex-1 py-3 rounded-xl items-center border border-slate-200"
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

      {/* What's New Modal */}
      <Modal
        visible={showWhatsNew}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissWhatsNew}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View 
            entering={FadeInUp.duration(500).springify()}
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderRadius: 28,
              width: '100%',
              maxWidth: 380,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Header */}
            <View style={{ backgroundColor: primaryColor, padding: 24, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <MaterialCommunityIcons name="mosque" size={28} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{t('whatsNew', language)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{t('whatsNewVersion', language)}</Text>
            </View>

            {/* Features */}
            <View style={{ padding: 20 }}>
              {[
                { title: t('whatsNewFeature1Title', language), desc: t('whatsNewFeature1Desc', language) },
                { title: t('whatsNewFeature2Title', language), desc: t('whatsNewFeature2Desc', language) },
                { title: t('whatsNewFeature3Title', language), desc: t('whatsNewFeature3Desc', language) },
              ].map((feature, idx) => (
                <View key={idx} style={{ flexDirection: 'row', marginBottom: idx < 2 ? 16 : 0 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${primaryColor}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 16 }}>
                      {feature.title.includes('🕌') ? '🕌' : 
                       feature.title.includes('📊') ? '📊' : 
                       feature.title.includes('📅') ? '📅' : 
                       feature.title.includes('⚡') ? '⚡' : '✨'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>{feature.title}</Text>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, lineHeight: 18 }}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Dismiss Button */}
            <View style={{ padding: 20, paddingTop: 4 }}>
              <TouchableOpacity
                onPress={dismissWhatsNew}
                style={{ backgroundColor: primaryColor, borderRadius: 16, padding: 16, alignItems: 'center' }}
                activeOpacity={0.85}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{t('whatsNewDismiss', language)}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Qadr Progress Modal */}
      <Modal
        visible={showQadrProgress}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQadrProgress(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Animated.View 
            entering={FadeInUp.duration(300)}
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '85%',
              paddingBottom: 34,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${primaryColor}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={22} color={primaryColor} />
                </View>
                <Text style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontSize: 18, fontWeight: 'bold' }}>{t("qadrProgress", language)}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQadrProgress(false)} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Class Picker */}
              <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t("selectClass", language)}</Text>
              <View style={{ borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 12, marginBottom: 16, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
                <Picker
                  selectedValue={qadrSelectedClass}
                  onValueChange={(val) => {
                    setQadrSelectedClass(val);
                    setQadrSelectedSubject('');
                    setQadrProgressData(null);
                  }}
                  style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
                  dropdownIconColor={isDark ? '#94A3B8' : '#64748B'}
                >
                  <Picker.Item label={t("selectClass", language)} value="" />
                  {initialData?.classes?.map((cls, idx) => (
                    <Picker.Item key={idx} label={cls} value={cls} />
                  ))}
                </Picker>
              </View>

              {/* Subject Picker */}
              <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t("selectSubject", language)}</Text>
              <View style={{ borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 12, marginBottom: 20, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
                <Picker
                  selectedValue={qadrSelectedSubject}
                  onValueChange={(val) => {
                    setQadrSelectedSubject(val);
                    setQadrProgressData(null);
                  }}
                  style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
                  dropdownIconColor={isDark ? '#94A3B8' : '#64748B'}
                >
                  <Picker.Item label={t("selectSubject", language)} value="" />
                  {qadrAvailableSubjects.map((subj, idx) => (
                    <Picker.Item key={idx} label={subj} value={subj} />
                  ))}
                </Picker>
              </View>

              {/* Show Progress Button */}
              <TouchableOpacity
                onPress={async () => {
                  if (!qadrSelectedClass || !qadrSelectedSubject) {
                    Alert.alert(t("error", language), t("classRequired", language));
                    return;
                  }
                  try {
                    const userNameData = await getData("userName");
                    const teacherId = userNameData?.no || userNameData?.name;
                    const config = await fetchQadrConfig(qadrSelectedClass, qadrSelectedSubject, teacherId);
                    if (config && (config.start !== undefined || config.surahDetails)) {
                      const progress = calculateProgress(config);
                      setQadrProgressData({ config, progress });
                    } else {
                      Alert.alert(t("error", language), t("noQadrConfig", language) || "No qadr configuration found for this subject");
                      setQadrProgressData(null);
                    }
                  } catch (err) {
                    console.error("Error fetching qadr progress:", err);
                    Alert.alert(t("error", language), t("errorLoadingData", language));
                  }
                }}
                disabled={!qadrSelectedClass || !qadrSelectedSubject}
                style={{ 
                  backgroundColor: qadrSelectedClass && qadrSelectedSubject ? primaryColor : '#94A3B8', 
                  borderRadius: 12, 
                  padding: 16, 
                  alignItems: 'center',
                  marginBottom: 20,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{t("showProgress", language) || "Show Progress"}</Text>
              </TouchableOpacity>

              {/* Progress Display */}
              {qadrProgressData && (
                <View style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderRadius: 16, padding: 16 }}>
                  {/* Book/Unit Info */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>{qadrProgressData.config.unitLabel || 'وحدة'}</Text>
                    <Text style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontSize: 14, fontWeight: '600' }}>{qadrProgressData.config.book || '-'}</Text>
                  </View>

                  {/* Full Year Progress */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>{language === 'ar' ? 'السنة الكاملة' : 'Full Year'}</Text>
                      <Text style={{ color: primaryColor, fontWeight: 'bold', fontSize: 14 }}>
                        {qadrProgressData.progress.wholeYearPercentage ? qadrProgressData.progress.wholeYearPercentage.toFixed(0) : 0}%
                      </Text>
                    </View>
                    <View style={{ height: 12, backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{ 
                        height: '100%', 
                        width: `${Math.min(100, Math.max(0, qadrProgressData.progress.wholeYearPercentage || 0))}%`, 
                        backgroundColor: primaryColor,
                        borderRadius: 6,
                      }} />
                    </View>
                  </View>

                  {/* Mid Year Progress */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>{language === 'ar' ? 'النصف الأول' : 'Mid Year'}</Text>
                      <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 14 }}>
                        {qadrProgressData.progress.examPercentage ? qadrProgressData.progress.examPercentage.toFixed(0) : 0}%
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ 
                        height: '100%', 
                        width: `${Math.min(100, Math.max(0, qadrProgressData.progress.examPercentage || 0))}%`, 
                        backgroundColor: '#F59E0B',
                        borderRadius: 4,
                      }} />
                    </View>
                  </View>

                  {/* Current Status */}
                  <View style={{ borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#E2E8F0', paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}>{language === 'ar' ? 'الحالي' : 'Current'}</Text>
                        <Text style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontSize: 16, fontWeight: 'bold' }}>
                          {qadrProgressData.progress.currentValue ?? 0}
                          {' / '}
                          {qadrProgressData.progress.rangeEnd ?? qadrProgressData.config.end ?? 0}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}>{language === 'ar' ? 'المتبقي' : 'Remaining'}</Text>
                        <Text style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontSize: 16, fontWeight: 'bold' }}>
                          {qadrProgressData.progress.remaining ?? 0}
                        </Text>
                      </View>
                    </View>
</View>
                </View>)}
              </ScrollView>
            </Animated.View>
          </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteItem !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDelete}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
            borderRadius: 20, 
            padding: 24, 
            width: '100%', 
            maxWidth: 340 
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ 
                width: 60, height: 60, borderRadius: 30, 
                backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16 
              }}>
                <Ionicons name="warning" size={30} color="#EF4444" />
              </View>
              <Text style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
                {t("deleteRecord", language) || "Delete Record"}
              </Text>
              <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                {t("deleteConfirm", language) || "Are you sure you want to delete this record?"}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={cancelDelete}
                style={{ 
                  flex: 1, padding: 14, borderRadius: 12, 
                  backgroundColor: isDark ? '#334155' : '#F1F5F9',
                  alignItems: 'center' 
                }}
              >
                <Text style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontWeight: '600' }}>
                  {t("cancel", language) || "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmDelete}
                style={{ 
                  flex: 1, padding: 14, borderRadius: 12, 
                  backgroundColor: '#EF4444',
                  alignItems: 'center' 
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {t("delete", language) || "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Index;
