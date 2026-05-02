import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSettings } from '../../services/SettingsContext';
import { t } from '../../services/translations';

const Prayer = () => {
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';
  const router = useRouter();

  const handleNavigation = (route, titleKey) => {
    if (route === '/quickPrayer') {
      router.push(route);
    } else if (route === '/prayerRecent') {
      // For now, if the route doesn't exist, we can just push it and show a placeholder or handle it later
      router.push(route);
    } else {
      router.push({
        pathname: '/prayerSetup',
        params: { nextRoute: route, titleKey }
      });
    }
  };

  const stackCards = [
    {
      id: 'fast',
      titleKey: 'fast', // or 'quickMark'
      subKey: 'quickMarkSub',
      icon: 'flash',
      iconSet: 'ionicons',
      color: '#F59E0B',
      bgColor: '#F59E0B15',
      route: '/quickPrayer'
    },
    {
      id: 'classByClass',
      titleKey: 'classByClass',
      subKey: 'selectClassForPrayer',
      icon: 'school',
      iconSet: 'ionicons',
      color: primaryColor,
      bgColor: `${primaryColor}15`,
      route: '/prayerTable'
    },
    {
      id: 'classOverview',
      titleKey: 'classLevelOverview',
      subKey: 'classLevelOverviewSub',
      icon: 'bar-chart',
      iconSet: 'ionicons',
      color: '#3B82F6',
      bgColor: '#3B82F615',
      route: '/prayerAnalytics'
    },
    {
      id: 'studentOverview',
      titleKey: 'studentOverview',
      subKey: 'studentOverviewSub',
      icon: 'person',
      iconSet: 'ionicons',
      color: '#8B5CF6',
      bgColor: '#8B5CF615',
      route: '/studentPrayerOverview'
    },
    {
      id: 'recentData',
      titleKey: 'recentDataCard',
      subKey: 'recentDataCardSub',
      icon: 'time',
      iconSet: 'ionicons',
      color: '#10B981',
      bgColor: '#10B98115',
      route: '/prayerRecent' // Need to create or map to existing recent data screen
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="px-5 pt-8 pb-4">
          <View className="flex-row items-center mb-1">
            <View 
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <MaterialCommunityIcons name="mosque" size={24} color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-text-main">{t('prayer', language)}</Text>
              <Text className="text-text-sub text-sm mt-0.5">{t('markPrayers', language)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stack Cards */}
        <View className="px-5 mt-2 gap-4">
          {stackCards.map((card, index) => (
            <Animated.View 
              key={card.id} 
              entering={FadeInUp.delay(50 + index * 100).duration(600).springify()}
            >
              <TouchableOpacity 
                onPress={() => handleNavigation(card.route, card.titleKey)}
                className="bg-surface p-5 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm"
                activeOpacity={0.7}
                style={{
                  shadowColor: '#000', 
                  shadowOpacity: 0.04, 
                  shadowRadius: 12, 
                  elevation: 2 
                }}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: card.bgColor }}
                >
                  {card.iconSet === 'material' ? (
                    <MaterialCommunityIcons name={card.icon} size={28} color={card.color} />
                  ) : (
                    <Ionicons name={card.icon} size={28} color={card.color} />
                  )}
                </View>
                
                <View className="flex-1">
                  <Text className="text-text-main font-bold text-lg mb-1">{t(card.titleKey, language)}</Text>
                  <Text className="text-text-sub text-xs leading-4 pr-2">{t(card.subKey, language)}</Text>
                </View>

                <View className="ml-2 w-8 h-8 rounded-full items-center justify-center bg-slate-50 dark:bg-slate-800">
                  <Ionicons 
                    name={language === 'ar' ? 'chevron-back' : 'chevron-forward'} 
                    size={16} 
                    color={isDark ? '#94A3B8' : '#64748B'} 
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Prayer;
