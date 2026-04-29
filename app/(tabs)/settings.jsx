import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from 'expo-updates';
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSettings } from "../../services/SettingsContext";
import { useRouter } from "expo-router";
import { t } from "../../services/translations";

const Settings = () => {
  const { theme, primaryColor, fontSize, fontFamily, language, saveSettings } = useSettings();
  const router = useRouter();

  const colors = ["#0EA5E9", "#10B981", "#F43F5E", "#8B5CF6", "#F59E0B"];

  const checkForUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          t("updateAvailable", language),
          t("updateMsg", language),
          [
            { text: t("later", language), style: "cancel" },
            { 
              text: t("updateRestart", language), 
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              }
            }
          ]
        );
      } else {
        Alert.alert(t("upToDate", language), t("upToDateMsg", language));
      }
    } catch (error) {
      Alert.alert(t("error", language), t("updateError", language));
    }
  };

  const changeLanguage = async (lang) => {
    if (lang === language) return;
    await saveSettings('language', lang);
    
    const shouldBeRTL = lang === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      I18nManager.allowRTL(shouldBeRTL);
      Alert.alert(
        t("langChangeTitle", lang),
        t("langChangeMsg", lang),
        [
          {
            text: t("restart", lang),
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (e) {
                // In dev mode, Updates.reloadAsync() may not work
                Alert.alert("Please restart the app manually to apply the language change.");
              }
            }
          }
        ],
        { cancelable: false }
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
        
        {/* Settings Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="px-6 mt-10 mb-2">
            <Text className="text-3xl font-bold text-text-main">{t("settings", language)}</Text>
            <Text className="text-text-sub text-sm mt-1">{t("customizeExperience", language)}</Text>
        </Animated.View>

        {/* Appearance Section */}
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} className="px-4 mt-6 space-y-4">
            <Text className="text-text-sub font-semibold mb-2 ml-1 uppercase text-xs tracking-wider">{t("appearance", language)}</Text>
            
            <View className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-4">
                {/* Dark Mode */}
                <View className="flex-row justify-between items-center mb-4 border-b border-slate-50 pb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="moon-outline" size={20} color={primaryColor} />
                        <Text className="text-text-main font-medium ml-3 text-base">{t("darkMode", language)}</Text>
                    </View>
                    <Switch 
                        value={theme === 'dark'} 
                        onValueChange={(val) => saveSettings('theme', val ? 'dark' : 'light')} 
                        trackColor={{ true: primaryColor, false: '#CBD5E1' }}
                    />
                </View>

                {/* Language Toggle */}
                <View className="mb-4 border-b border-slate-50 pb-4">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="language-outline" size={20} color={primaryColor} />
                        <Text className="text-text-main font-medium ml-3 text-base">{t("language", language)}</Text>
                    </View>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => changeLanguage('en')}
                            className="flex-1 py-3 rounded-xl items-center border-2"
                            style={{
                                borderColor: language === 'en' ? primaryColor : 'transparent',
                                backgroundColor: language === 'en' ? `${primaryColor}10` : '#F1F5F9',
                            }}
                        >
                            <Text className="text-lg mb-1">🇬🇧</Text>
                            <Text 
                                className="text-xs font-semibold"
                                style={{ color: language === 'en' ? primaryColor : '#64748B' }}
                            >
                                {t("english", language)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => changeLanguage('ar')}
                            className="flex-1 py-3 rounded-xl items-center border-2"
                            style={{
                                borderColor: language === 'ar' ? primaryColor : 'transparent',
                                backgroundColor: language === 'ar' ? `${primaryColor}10` : '#F1F5F9',
                            }}
                        >
                            <Text className="text-lg mb-1">🇸🇦</Text>
                            <Text 
                                className="text-xs font-semibold"
                                style={{ color: language === 'ar' ? primaryColor : '#64748B' }}
                            >
                                {t("arabic", language)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Primary Color */}
                <View>
                    <Text className="text-text-sub text-sm mb-3">{t("primaryColor", language)}</Text>
                    <View className="flex-row gap-3">
                        {colors.map(color => (
                            <TouchableOpacity 
                                key={color}
                                onPress={() => saveSettings('primaryColor', color)}
                                className="w-10 h-10 rounded-full items-center justify-center border-2"
                                style={{ backgroundColor: color, borderColor: primaryColor === color ? '#0F172A' : 'transparent' }}
                            >
                                {primaryColor === color && <Ionicons name="checkmark" size={20} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Animated.View>


        {/* About App Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} className="px-4 mt-8 space-y-4">
            <Text className="text-text-sub font-semibold mb-2 ml-1 uppercase text-xs tracking-wider">{t("systemInfo", language)}</Text>
            
            <View className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <TouchableOpacity onPress={() => router.push('/aboutDev')} className="p-4 flex-row items-center justify-between border-b border-slate-50">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}20` }}>
                            <Ionicons name="information-circle-outline" size={24} color={primaryColor} />
                        </View>
                        <Text className="text-text-main font-medium text-base">{t("aboutDeveloper", language)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity onPress={checkForUpdate} className="p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}20` }}>
                            <Ionicons name="cloud-download-outline" size={24} color={primaryColor} />
                        </View>
                        <View>
                            <Text className="text-text-main font-medium text-base">{t("checkForUpdates", language)}</Text>
                            <Text className="text-text-sub text-xs">{t("forceOTA", language)}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default Settings;
