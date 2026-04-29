import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings } from '../services/SettingsContext';
import { readUserData } from '../services/firebase_crud';
import NetInfo from '@react-native-community/netinfo';
import { t } from '../services/translations';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function BlacklistHistory() {
  const router = useRouter();
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const data = await readUserData('blacklistHistory');
        if (data) {
          // data is like { rollNo1: { blockId1: {...}, blockId2: {...} }, rollNo2: {...} }
          const flatHistory = [];
          Object.keys(data).forEach(rollNo => {
            const studentRecords = data[rollNo];
            Object.keys(studentRecords).forEach(blockId => {
              flatHistory.push({ rollNo, ...studentRecords[blockId] });
            });
          });
          // Sort by blockedAt descending
          flatHistory.sort((a, b) => new Date(b.blockedAt) - new Date(a.blockedAt));
          setHistory(flatHistory);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isActive = item.status === 'blocked';
    const dateStr = new Date(item.blockedAt).toLocaleDateString();

    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(400).springify()} style={{ marginBottom: 12 }}>
        <View style={{ borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0', elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
                <MaterialCommunityIcons name={isActive ? "account-alert" : "account-check"} size={20} color={isActive ? "#DC2626" : "#10B981"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#F8FAFC' : '#0F172A' }}>{item.studentName}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.rollNo} • {item.className}</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: isActive ? '#FEE2E2' : '#D1FAE5', marginLeft: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: isActive ? '#DC2626' : '#10B981' }}>{isActive ? t('active', language) : t('unblocked', language)}</Text>
            </View>
          </View>
          
          <View style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748B', marginBottom: 4 }}>{t('blockReason', language)}</Text>
            <Text style={{ fontSize: 14, color: isDark ? '#F8FAFC' : '#0F172A' }}>{item.reason}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="calendar-outline" size={12} color="#64748B" />
              <Text style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>{t('date', language)}: {dateStr}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="person-outline" size={12} color="#64748B" />
              <Text style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>{t('blockedBy', language)}: {item.blockedBy}</Text>
            </View>
            {!isActive && item.unblockedBy && (
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 4 }}>
                <MaterialCommunityIcons name="account-key-outline" size={12} color="#10B981" />
                <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>{t('unblockedBy', language)}: {item.unblockedBy}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View entering={FadeInDown.duration(600).springify()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: primaryColor, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{t('blacklistHistory', language)}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{t('viewHistory', language)}</Text>
          </View>
        </Animated.View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : history.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <MaterialCommunityIcons name="history" size={64} color="#CBD5E1" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#F8FAFC' : '#0F172A', marginTop: 16 }}>{t('noHistory', language)}</Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 }}>{t('noHistoryDesc', language)}</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.rollNo}-${index}`}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
