import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSettings } from '../../services/SettingsContext';
import { t } from '../../services/translations';

const Summary = () => {
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';
  const router = useRouter();

  const cards = [
    {
      title: t('studentProfile', language),
      subtitle: t('studentProfileSub', language),
      icon: 'person-outline',
      gradient: primaryColor,
      route: '/studentProfile',
    },
    {
      title: t('classAnalytics', language),
      subtitle: t('classAnalyticsSub', language),
      icon: 'analytics-outline',
      gradient: '#8B5CF6',
      route: '/classAnalytics',
    },
  ];

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
              <Ionicons name="bar-chart" size={20} color={primaryColor} />
            </View>
            <View>
              <Text className="text-2xl font-bold text-text-main">{t('analytics', language)}</Text>
              <Text className="text-text-sub text-xs mt-0.5">{t('advancedReports', language)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-5 mt-5">
          <View 
            className="rounded-2xl p-5 border border-slate-50 bg-surface"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}
          >
            <View className="flex-row items-center mb-3">
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={primaryColor} />
              <Text className="text-text-main text-sm font-bold ml-1">{t('quickSummary', language)}</Text>
            </View>
            <Text className="text-text-sub text-xs leading-5">
              {t('quickSummaryDesc', language)}
            </Text>
          </View>
        </Animated.View>

        {/* Report Cards */}
        {cards.map((card, idx) => (
          <Animated.View 
            key={idx}
            entering={FadeInUp.delay(200 + idx * 120).duration(600).springify()} 
            className="px-5 mt-4"
          >
            <TouchableOpacity
              onPress={() => router.push(card.route)}
              className="rounded-2xl overflow-hidden"
              style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 }}
              activeOpacity={0.85}
            >
              {/* Card Header */}
              <View 
                className="p-5 pb-4"
                style={{ backgroundColor: card.gradient }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
                    <Ionicons name={card.icon} size={24} color="white" />
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                </View>
                <Text className="text-white text-xl font-bold mt-4">{card.title}</Text>
              </View>

              {/* Card Body */}
              <View className="bg-surface p-4 border-x border-b border-slate-50">
                <Text className="text-text-sub text-xs leading-5">{card.subtitle}</Text>

                {/* Feature Chips */}
                <View className="flex-row flex-wrap mt-3 gap-2">
                  {idx === 0 ? (
                    <>
                      <Chip label={t('attendancePct', language)} color={card.gradient} />
                      <Chip label={t('subjectBars', language)} color={card.gradient} />
                      <Chip label={t('monthlyTrend', language)} color={card.gradient} />
                      <Chip label={t('calendarMap', language)} color={card.gradient} />
                    </>
                  ) : (
                    <>
                      <Chip label={t('classAverage', language)} color={card.gradient} />
                      <Chip label={t('leaderboard', language)} color={card.gradient} />
                      <Chip label={t('atRiskAlert', language)} color={card.gradient} />
                      <Chip label={t('subjectTurnout', language)} color={card.gradient} />
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Old Summary Search — kept as a compact link */}
        <Animated.View entering={FadeInUp.delay(450).duration(600).springify()} className="px-5 mt-6">
          <TouchableOpacity
            onPress={() => router.push('/summarySearch')}
            className="bg-surface rounded-2xl p-4 flex-row items-center justify-between border border-slate-50"
            style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: `${primaryColor}15` }}>
                <Ionicons name="search" size={16} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-text-main font-semibold text-sm">{t('classicSummarySearch', language)}</Text>
                <Text className="text-text-sub text-[10px] mt-0.5">{t('filterByClassSubject', language)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const Chip = ({ label, color }) => (
  <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}12` }}>
    <Text className="text-[10px] font-semibold" style={{ color }}>{label}</Text>
  </View>
);

export default Summary