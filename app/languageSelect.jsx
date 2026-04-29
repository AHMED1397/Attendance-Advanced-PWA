import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSettings } from "../services/SettingsContext";

const LanguageSelect = () => {
  const router = useRouter();
  const { primaryColor, saveSettings } = useSettings();
  const [selected, setSelected] = React.useState("en");

  const handleContinue = async () => {
    await saveSettings("language", selected);
    await AsyncStorage.setItem("app_langSelected", "true");

    if (selected === "ar" && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
      // Need restart for RTL to take effect
      const Updates = require("expo-updates");
      try {
        await Updates.reloadAsync();
      } catch {
        router.replace("/login");
      }
    } else if (selected === "en" && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false);
      const Updates = require("expo-updates");
      try {
        await Updates.reloadAsync();
      } catch {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-8">
        {/* Globe Icon */}
        <Animated.View
          entering={FadeInDown.duration(700).springify()}
          className="items-center mb-8"
        >
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Ionicons name="globe-outline" size={48} color={primaryColor} />
          </View>
          <Text className="text-text-main text-3xl font-bold text-center">
            Choose Your Language
          </Text>
          <Text className="text-text-main text-3xl font-bold text-center mt-1">
            اختر لغتك
          </Text>
          <Text className="text-text-sub text-sm text-center mt-3">
            Select your preferred language
          </Text>
        </Animated.View>

        {/* Language Options */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(700).springify()}
          className="gap-4"
        >
          {/* English Option */}
          <TouchableOpacity
            onPress={() => setSelected("en")}
            className="flex-row items-center p-5 rounded-2xl border-2"
            style={{
              borderColor: selected === "en" ? primaryColor : "transparent",
              backgroundColor: selected === "en" ? `${primaryColor}08` : undefined,
            }}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{
                backgroundColor:
                  selected === "en" ? `${primaryColor}20` : "#F1F5F9",
              }}
            >
              <Text className="text-2xl">🇬🇧</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-main text-lg font-bold">English</Text>
              <Text className="text-text-sub text-xs mt-0.5">
                Continue in English
              </Text>
            </View>
            {selected === "en" && (
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {/* Arabic Option */}
          <TouchableOpacity
            onPress={() => setSelected("ar")}
            className="flex-row items-center p-5 rounded-2xl border-2"
            style={{
              borderColor: selected === "ar" ? primaryColor : "transparent",
              backgroundColor: selected === "ar" ? `${primaryColor}08` : undefined,
            }}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{
                backgroundColor:
                  selected === "ar" ? `${primaryColor}20` : "#F1F5F9",
              }}
            >
              <Text className="text-2xl">🇸🇦</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-main text-lg font-bold">العربية</Text>
              <Text className="text-text-sub text-xs mt-0.5">
                المتابعة بالعربية
              </Text>
            </View>
            {selected === "ar" && (
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(700).springify()}
          className="mt-10"
        >
          <TouchableOpacity
            onPress={handleContinue}
            style={{ backgroundColor: primaryColor }}
            className="rounded-2xl p-4 items-center flex-row justify-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base mr-2">
              {selected === "ar" ? "متابعة" : "Continue"}
            </Text>
            <Ionicons
              name={selected === "ar" ? "arrow-back" : "arrow-forward"}
              size={18}
              color="white"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default LanguageSelect;
