import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useCallback } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { getData, storeData } from "../../services/asyncStorage";
import { readUserData, writeUserData, deleteUserData } from "../../services/firebase_crud";
import NetInfo from "@react-native-community/netinfo";
import { useSettings } from "../../services/SettingsContext";
import { t } from "../../services/translations";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";



// Cross-platform confirm helper
const crossConfirm = (title, message, onConfirm) => {
  if (Platform.OS === "web") {
    if (window.confirm(title + "\n" + message)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", style: "destructive", onPress: onConfirm },
    ]);
  }
};

const crossAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(title + "\n" + message);
  } else {
    Alert.alert(title, message);
  }
};

const Blacklist = () => {
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === "dark";
  const router = useRouter();

  const [blacklistData, setBlacklistData] = useState({});
  const [initialData, setInitialData] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState("permanent"); // "permanent", "1", "3", "7", "30"
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await getData("userName");
      if (userData) setUserName(userData.name);
      const data = await getData("initialData");
      if (data) setInitialData(data);
      await fetchBlacklist();
    } catch (error) {
      console.error("Error loading blacklist data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        let data = await readUserData("blacklist");
        if (data) {
          // Cleanup expired entries
          const now = new Date();
          let hasExpired = false;
          const entries = Object.entries(data);
          for (const [rollNo, entry] of entries) {
            if (entry.expiresAt && new Date(entry.expiresAt) < now) {
              await deleteUserData("blacklist/" + rollNo);
              if (entry.blockId) {
                await writeUserData(`blacklistHistory/${rollNo}/${entry.blockId}/status`, 'expired');
                await writeUserData(`blacklistHistory/${rollNo}/${entry.blockId}/unblockedBy`, 'System (Expired)');
                await writeUserData(`blacklistHistory/${rollNo}/${entry.blockId}/unblockedAt`, now.toISOString());
              }
              delete data[rollNo];
              hasExpired = true;
            }
          }
          setBlacklistData(data);
          await storeData(data, "blacklistData");
        } else {
          setBlacklistData({});
          await storeData({}, "blacklistData");
        }
      } else {
        const cached = await getData("blacklistData");
        if (cached) setBlacklistData(cached);
      }
    } catch (error) {
      console.error("Error fetching blacklist:", error);
      const cached = await getData("blacklistData");
      if (cached) setBlacklistData(cached);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBlacklist();
    setRefreshing(false);
  }, []);

  const doBlock = async () => {
    setIsSubmitting(true);
    try {
      const netState = await NetInfo.fetch();
      let updated = { ...blacklistData };
      const timestamp = new Date().toISOString();
      let expiresAt = null;
      if (blockDuration !== "permanent") {
        const days = parseInt(blockDuration);
        if (!isNaN(days)) {
          expiresAt = new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      for (const rollNo of selectedStudents) {
        const studentName = initialData?.students?.[selectedClass]?.[rollNo] || "";
        const blockId = new Date().getTime().toString() + "-" + rollNo;
        const entry = {
          studentName,
          className: selectedClass,
          reason: blockReason.trim(),
          blockedBy: userName,
          blockedAt: timestamp,
          expiresAt: expiresAt,
          duration: blockDuration,
          blockId: blockId
        };
        if (netState.isConnected) {
          await writeUserData("blacklist/" + rollNo, entry);
          await writeUserData(`blacklistHistory/${rollNo}/${blockId}`, { ...entry, status: "blocked" });
        }
        updated[rollNo] = entry;
      }
      
      setBlacklistData(updated);
      await storeData(updated, "blacklistData");
      
      setShowBlockModal(false);
      setSelectedClass("");
      setSelectedStudents([]);
      setBlockReason("");
      setBlockDuration("permanent");
      crossAlert(t("studentBlocked", language), t("studentBlockedMsg", language));
    } catch (error) {
      console.error("Error blocking student:", error);
      crossAlert(t("error", language), error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = () => {
    if (!selectedClass) {
      crossAlert(t("error", language), t("classRequired", language));
      return;
    }
    if (selectedStudents.length === 0) {
      crossAlert(t("error", language), t("studentRequired", language));
      return;
    }
    if (!blockReason.trim()) {
      crossAlert(t("error", language), t("reasonRequired", language));
      return;
    }
    crossConfirm(
      t("confirmBlock", language),
      t("confirmBlockMsg", language),
      doBlock
    );
  };

  const handleUnblock = (rollNo, entry) => {
    if (entry.blockedBy !== userName) {
      crossAlert(t("error", language), t("onlyBlockerCanUnblock", language));
      return;
    }
    crossConfirm(
      t("confirmUnblock", language),
      t("confirmUnblockMsg", language),
      async () => {
        try {
          const netState = await NetInfo.fetch();
          if (netState.isConnected) {
            await deleteUserData("blacklist/" + rollNo);
            if (entry.blockId) {
              await writeUserData(`blacklistHistory/${rollNo}/${entry.blockId}/status`, 'unblocked');
              await writeUserData(`blacklistHistory/${rollNo}/${entry.blockId}/unblockedBy`, userName);
              await writeUserData(`blacklistHistory/${rollNo}/${entry.blockId}/unblockedAt`, new Date().toISOString());
            }
          }
          const updated = { ...blacklistData };
          delete updated[rollNo];
          setBlacklistData(updated);
          await storeData(updated, "blacklistData");
          crossAlert(t("studentUnblocked", language), t("studentUnblockedMsg", language));
        } catch (error) {
          console.error("Error unblocking student:", error);
          crossAlert(t("error", language), error.message);
        }
      }
    );
  };

  const blockedEntries = Object.entries(blacklistData);
  const eligibleClasses = initialData?.classes?.filter(c => c !== "الصف السادس") || [];
  
  const eligibleStudents =
    selectedClass && initialData?.students?.[selectedClass]
      ? Object.entries(initialData.students[selectedClass]).filter(
          ([rollNo]) => !blacklistData[rollNo]
        )
      : [];

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ color: "#64748B", marginTop: 12, fontSize: 14 }}>{t("loading", language)}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
          }
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).springify()} style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: "#FEE2E2" }}>
                  <MaterialCommunityIcons name="account-cancel" size={22} color="#DC2626" />
                </View>
                <View>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: isDark ? "#F8FAFC" : "#0F172A" }}>{t("blacklist", language)}</Text>
                  <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{t("blacklistManage", language)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push("/blacklistHistory")} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }}>
                <MaterialCommunityIcons name="history" size={18} color={primaryColor} />
                <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>{t("viewHistory", language)}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Stats Card */}
          <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <View style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: isDark ? "#334155" : "#F1F5F9", elevation: 3 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: blockedEntries.length > 0 ? "#FEE2E2" : "#DCFCE7" }}>
                  <MaterialCommunityIcons name={blockedEntries.length > 0 ? "account-alert" : "account-check"} size={20} color={blockedEntries.length > 0 ? "#DC2626" : "#16A34A"} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: isDark ? "#F8FAFC" : "#0F172A" }}>{blockedEntries.length}</Text>
                  <Text style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: "500", letterSpacing: 1 }}>{t("blockedStudents", language)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", paddingLeft: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
                  {eligibleClasses.map((cls, idx) => {
                    const count = blockedEntries.filter(([, e]) => e.className === cls).length;
                    if (count === 0) return null;
                    return (
                      <View key={idx} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginLeft: 6, backgroundColor: "#FEE2E2" }}>
                        <Text style={{ fontSize: 10, fontWeight: "bold", color: "#DC2626" }}>{cls.replace("الصف ", "") + " " + count}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Animated.View>

          {/* Blocked Students List */}
          <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: isDark ? "#F8FAFC" : "#0F172A", marginBottom: 12 }}>{t("blockedStudents", language)}</Text>

            {blockedEntries.length === 0 ? (
              <View style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: isDark ? "#334155" : "#F1F5F9" }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12, backgroundColor: "#DCFCE7" }}>
                  <MaterialCommunityIcons name="account-check" size={32} color="#16A34A" />
                </View>
                <Text style={{ fontWeight: "600", fontSize: 16, color: isDark ? "#F8FAFC" : "#0F172A" }}>{t("noBlockedStudents", language)}</Text>
                <Text style={{ fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 }}>{t("noBlockedStudentsDesc", language)}</Text>
              </View>
            ) : (
              blockedEntries.map(([rollNo, entry], index) => (
                <Animated.View key={rollNo} entering={FadeInUp.delay(250 + index * 60).duration(400).springify()}>
                  <View style={{ borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, backgroundColor: isDark ? "#2D1215" : "#FEF2F2", borderColor: isDark ? "#7F1D1D" : "#FECACA", elevation: 2 }}>
                    {/* Student info */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: isDark ? "#450A0A" : "#FEE2E2" }}>
                        <Text style={{ fontSize: 14, fontWeight: "bold", color: "#DC2626" }}>{rollNo}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: isDark ? "#FCA5A5" : "#991B1B" }}>{entry.studentName}</Text>
                        <Text style={{ fontSize: 12, marginTop: 2, color: isDark ? "#FCA5A5" : "#B91C1C" }}>{entry.className}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: isDark ? "#450A0A" : "#FEE2E2" }}>
                        <Text style={{ fontSize: 10, fontWeight: "bold", color: "#DC2626" }}>{t("blocked", language)}</Text>
                      </View>
                    </View>
                    {/* Reason */}
                    <View style={{ borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: isDark ? "#450A0A" : "#FEE2E2" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Ionicons name="alert-circle" size={14} color="#DC2626" />
                        <Text style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginLeft: 4, color: "#DC2626" }}>{t("blockReason", language)}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: isDark ? "#FCA5A5" : "#991B1B" }}>{entry.reason}</Text>
                      {entry.expiresAt && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)" }}>
                          <Ionicons name="time-outline" size={12} color={isDark ? "#FCA5A5" : "#991B1B"} />
                          <Text style={{ fontSize: 10, marginLeft: 4, fontWeight: "bold", color: isDark ? "#FCA5A5" : "#991B1B" }}>
                            {t("expiryDate", language)}: {new Date(entry.expiresAt).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Footer */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="person-outline" size={12} color={isDark ? "#FCA5A5" : "#B91C1C"} />
                        <Text style={{ fontSize: 11, marginLeft: 4, color: isDark ? "#FCA5A5" : "#B91C1C" }}>{t("blockedBy", language) + ": " + entry.blockedBy}</Text>
                      </View>
                      {entry.blockedBy === userName ? (
                        <TouchableOpacity onPress={() => handleUnblock(rollNo, entry)} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }} activeOpacity={0.7}>
                          <MaterialCommunityIcons name="account-check" size={14} color="#16A34A" />
                          <Text style={{ fontSize: 12, fontWeight: "600", marginLeft: 4, color: "#16A34A" }}>{t("unblockStudent", language)}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </Animated.View>
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          onPress={() => setShowBlockModal(true)}
          style={{ position: "absolute", bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", shadowColor: "#DC2626", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Block Student Modal */}
      <Modal visible={showBlockModal} transparent={true} animationType="slide" onRequestClose={() => setShowBlockModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 34, maxHeight: "85%" }}>
            {/* Modal Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#E2E8F0" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 8, backgroundColor: "#FEE2E2" }}>
                  <MaterialCommunityIcons name="account-cancel" size={18} color="#DC2626" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: isDark ? "#F8FAFC" : "#0F172A" }}>{t("blockStudent", language)}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBlockModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
              {/* Class Picker */}
              <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#64748B" }}>{t("class", language)}</Text>
              <View style={{ backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", marginBottom: 16 }}>
                <Picker
                  selectedValue={selectedClass}
                  onValueChange={(value) => { setSelectedClass(value); setSelectedStudents([]); }}
                  style={{ height: 50, color: isDark ? "#fff" : "#000" }}
                >
                  <Picker.Item label={t("selectClass", language)} value="" />
                  {eligibleClasses.map((cls, index) => (
                    <Picker.Item key={index} label={cls} value={cls} />
                  ))}
                </Picker>
              </View>

              {/* Student Picker */}
              <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#64748B" }}>{t("selectStudentToBlock", language)}</Text>
              
              {selectedClass ? (
                <View style={{ backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", marginBottom: 16, maxHeight: 200 }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {eligibleStudents.map(([rollNo, name], index) => {
                      const isSelected = selectedStudents.includes(rollNo);
                      return (
                        <TouchableOpacity
                          key={rollNo}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedStudents(prev => prev.filter(r => r !== rollNo));
                            } else {
                              setSelectedStudents(prev => [...prev, rollNo]);
                            }
                          }}
                          style={{ flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: index < eligibleStudents.length - 1 ? 1 : 0, borderBottomColor: isDark ? "#334155" : "#E2E8F0" }}
                          activeOpacity={0.7}
                        >
                          <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isSelected ? "#DC2626" : (isDark ? "#475569" : "#CBD5E1"), backgroundColor: isSelected ? "#DC2626" : "transparent", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                            {isSelected ? <Ionicons name="checkmark" size={16} color="white" /> : null}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#F8FAFC" : "#0F172A" }}>{name}</Text>
                            <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{rollNo}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    {eligibleStudents.length === 0 && (
                      <View style={{ padding: 16, alignItems: "center" }}>
                        <Text style={{ color: "#64748B" }}>No eligible students</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              ) : (
                <View style={{ backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", marginBottom: 16, padding: 16, alignItems: "center" }}>
                  <Text style={{ color: "#64748B" }}>{t("selectClass", language)}</Text>
                </View>
              )}

              {/* Reason Input */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, color: "#64748B" }}>{t("blockReason", language)}</Text>
                <Text style={{ color: "#DC2626", marginLeft: 4, fontSize: 16, fontWeight: "bold" }}>{"*"}</Text>
              </View>
              <View style={{ backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", marginBottom: 16, overflow: "hidden" }}>
                <TextInput
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder={t("enterReason", language)}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  style={{ padding: 16, minHeight: 80, textAlignVertical: "top", color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 14 }}
                />
              </View>

              {/* Duration Input (Stepper) */}
              <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#64748B" }}>{t("blockDuration", language)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderRadius: 16, borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", marginBottom: 16, padding: 4 }}>
                <TouchableOpacity 
                  onPress={() => {
                    const current = blockDuration === 'permanent' ? 0 : parseInt(blockDuration);
                    if (current > 0) setBlockDuration((current - 1).toString() || 'permanent');
                    if (current === 1) setBlockDuration('permanent');
                  }}
                  style={{ padding: 12 }}
                >
                  <Ionicons name="remove-circle-outline" size={28} color={primaryColor} />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <TextInput
                    value={blockDuration === 'permanent' ? '0' : blockDuration}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^0-9]/g, '');
                      setBlockDuration(clean === '0' || clean === '' ? 'permanent' : clean);
                    }}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    style={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 20, fontWeight: 'bold', textAlign: 'center', width: '100%' }}
                  />
                  <Text style={{ fontSize: 10, color: "#64748B", marginTop: -4 }}>
                    {blockDuration === 'permanent' ? t("permanent", language) : t("days", language)}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={() => {
                    const current = blockDuration === 'permanent' ? 0 : parseInt(blockDuration);
                    setBlockDuration((current + 1).toString());
                  }}
                  style={{ padding: 12 }}
                >
                  <Ionicons name="add-circle-outline" size={28} color={primaryColor} />
                </TouchableOpacity>
              </View>

              {/* Selected student preview */}
              {selectedStudents.length > 0 && selectedClass ? (
                <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, backgroundColor: isDark ? "#2D1215" : "#FEF2F2", borderColor: isDark ? "#7F1D1D" : "#FECACA" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: isDark ? "#450A0A" : "#FEE2E2" }}>
                      <MaterialCommunityIcons name="account-multiple-minus" size={20} color="#DC2626" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#FCA5A5" : "#991B1B" }}>
                        {selectedStudents.length} {t("blockedStudents", language) || "Students Selected"}
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 2, color: isDark ? "#FCA5A5" : "#B91C1C" }}>{selectedClass}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Block Button */}
            <View style={{ paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={handleBlock}
                disabled={isSubmitting}
                style={{ backgroundColor: "#DC2626", opacity: isSubmitting ? 0.6 : 1, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons name="account-cancel" size={20} color="white" />
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>{t("blockStudent", language)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Blacklist;
