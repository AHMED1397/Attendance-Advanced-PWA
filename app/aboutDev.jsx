import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSettings } from "../services/SettingsContext";
import { useRouter } from "expo-router";
import { t } from "../services/translations";

const AboutDeveloper = () => {
  const { primaryColor, language } = useSettings();
  const router = useRouter();

  const openEmail = () => Linking.openURL("mailto:ahmedhaqqaniyyah@gmail.com");
  const callPhone = () => Linking.openURL("tel:0777468856");
  const openWhatsApp = () => Linking.openURL("https://wa.me/94724583405");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center p-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-main">{t('developerInfo', language)}</Text>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Section */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="items-center mt-6 mb-6">
          <View className="relative shadow-lg border-primary/30">
             <View
                className="w-28 h-28 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <MaterialIcons name="person" size={60} color="white" />
              </View>
             <View className="absolute bottom-0 right-0 bg-surface border-4 border-background rounded-full p-1.5">
                <Ionicons name="code-slash" size={16} color={primaryColor} />
             </View>
          </View>
          
          <Text className="text-2xl font-bold text-text-main mt-4">Ibnu Irshad</Text>
          <Text className="text-text-sub text-base mt-1 text-center px-6">
            {t('studentAt', language)}
          </Text>
           <View className="px-3 py-1 rounded-full mt-2" style={{ backgroundColor: `${primaryColor}20` }}>
            <Text className="font-medium text-xs" style={{ color: primaryColor }}>Grade 6</Text>
          </View>
        </Animated.View>

        {/* Info Cards */}
        <View className="px-4 space-y-4">
            
          {/* Tech Stack */}
          <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
              <Text className="text-text-sub font-semibold mb-2 ml-1 uppercase text-xs tracking-wider">{t('techStack', language)}</Text>
              <View className="bg-surface p-4 rounded-2xl shadow-sm border border-slate-100 flex-row flex-wrap gap-2">
                 {["HTML", "CSS", "JS", "Tailwind", "React", "React Native", "Firebase"].map((tech, index) =>(
                     <View key={index} className="px-4 py-1.5 rounded-lg border" style={{ borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}10` }}>
                        <Text className="text-xs font-medium" style={{ color: primaryColor }}>{tech}</Text>
                     </View>
                 ))}
              </View>
          </Animated.View>

          {/* Contact Info */}
          <Animated.View entering={FadeInUp.delay(400).duration(600).springify()}>
             <Text className="text-text-sub font-semibold mb-3 mt-4 ml-1 uppercase text-xs tracking-wider">{t('contact', language)}</Text>
             <View className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                
                <TouchableOpacity onPress={openEmail} className="flex-row items-center p-4 border-b border-slate-50">
                   <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
                       <MaterialIcons name="email" size={20} color={primaryColor} />
                   </View>
                   <View className="flex-1">
                      <Text className="text-text-sub text-xs">{t('email', language)}</Text>
                      <Text className="text-text-main font-medium">ahmedhaqqaniyyah@gmail.com</Text>
                   </View>
                   <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity onPress={callPhone} className="flex-row items-center p-4 border-b border-slate-50">
                    <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4">
                       <Ionicons name="call" size={20} color="#10B981" />
                   </View>
                   <View className="flex-1">
                      <Text className="text-text-sub text-xs">{t('phone', language)}</Text>
                      <Text className="text-text-main font-medium">+94 77 7468856</Text>
                   </View>
                   <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity onPress={openWhatsApp} className="flex-row items-center p-4">
                    <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-4">
                       <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                   </View>
                   <View className="flex-1">
                      <Text className="text-text-sub text-xs">{t('whatsapp', language)}</Text>
                      <Text className="text-text-main font-medium">+94 72 4583405</Text>
                   </View>
                   <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>

             </View>
          </Animated.View>

          {/* Version Info */}
           <Animated.View entering={FadeInUp.delay(600).duration(600).springify()} className="mt-4 items-center">
              <Text className="text-text-sub text-xs">{t('version', language)}</Text>
              <Text className="text-text-sub text-[10px] mt-1">{t('madeBy', language)}</Text>
           </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutDeveloper;
