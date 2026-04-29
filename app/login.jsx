import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { readUserData } from "../services/firebase_crud";
import { storeData } from "../services/asyncStorage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useSettings } from "../services/SettingsContext";
import { t } from "../services/translations";

const Login = () => {
  const [initialData, setInitialData] = useState({});
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  const router = useRouter();

  useEffect(() => {
    readUserData("initialData").then((res) => {
      storeData(res, "initialData");
      setInitialData(res);
    });
  }, []);

  const checker = () => {
    if (!username || !password) {
      alert(t("pleaseFillForm", language));
      return;
    }
    if (username.no !== password) {
      alert(t("invalidPassword", language));
      return;
    }

    storeData(username, "userName");
    alert(t("loggedIn", language));
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Hero Header */}
        <Animated.View 
          entering={FadeInDown.duration(700).springify()}
          style={{ backgroundColor: primaryColor }}
          className="rounded-b-[40px] px-8 pt-16 pb-12"
        >
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6 self-center">
            <Ionicons name="school" size={40} color="white" />
          </View>
          <Text className="text-white text-3xl font-bold text-center">
            {t("appName", language)}
          </Text>
          <Text className="text-white/70 text-sm text-center mt-2">
            {t("signInSubtitle", language)}
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(700).springify()}
          className="px-6 -mt-6"
        >
          <View className="bg-surface rounded-3xl px-6 py-8 shadow-lg" 
                style={{ 
                  shadowColor: isDark ? '#000' : '#64748B', 
                  shadowOffset: { width: 0, height: 8 }, 
                  shadowOpacity: 0.12, 
                  shadowRadius: 24, 
                  elevation: 12 
                }}>
            
            {/* Teacher Selector */}
            <View className="mb-5">
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                {t("teacher", language)}
              </Text>
              <View className="flex-row items-center bg-background rounded-2xl border border-slate-100 overflow-hidden">
                <View className="w-11 h-11 rounded-xl items-center justify-center ml-2" 
                      style={{ backgroundColor: `${primaryColor}15` }}>
                  <Ionicons name="person" size={18} color={primaryColor} />
                </View>
                <Picker
                  selectedValue={username?.name || ""}
                  onValueChange={(itemValue) => {
                    const selectedTeacher = initialData?.teacher?.find(t => t.name === itemValue);
                    setUserName(selectedTeacher || "");
                  }}
                  style={{ flex: 1, height: 50, color: isDark ? '#F8FAFC' : '#1F2937', backgroundColor: 'transparent', borderWidth: 0 }}
                  dropdownIconColor={primaryColor}
                >
                  <Picker.Item label={t("selectName", language)} value="" color="#94A3B8" />
                  {initialData?.teacher?.map((teacher, index) => (
                    <Picker.Item key={index} label={teacher.name} value={teacher.name} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-text-sub text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                {t("password", language)}
              </Text>
              <View className="flex-row items-center bg-background rounded-2xl border border-slate-100">
                <View className="w-11 h-11 rounded-xl items-center justify-center ml-2" 
                      style={{ backgroundColor: `${primaryColor}15` }}>
                  <Ionicons name="lock-closed" size={18} color={primaryColor} />
                </View>
                <TextInput
                  className="flex-1 p-3 text-text-main text-sm"
                  placeholder={t("enterPassword", language)}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(e) => setPassword(e)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  className="pr-4"
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={{ backgroundColor: primaryColor }}
              className="rounded-2xl p-4 items-center flex-row justify-center"
              onPress={checker}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-base mr-2">{t("signIn", language)}</Text>
              <Ionicons name={language === 'ar' ? "arrow-back" : "arrow-forward"} size={18} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(700).springify()}
          className="flex-1 justify-end px-6 pb-8"
        >
          <Text className="text-center text-text-sub text-sm">
            {t("needAccount", language)}{" "}
            <Text style={{ color: primaryColor }} className="font-semibold">
              {t("contactAdmin", language)}
            </Text>
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
