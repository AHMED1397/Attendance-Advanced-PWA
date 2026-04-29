import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettings } from "../../services/SettingsContext";
import { View } from "react-native";
import { t } from "../../services/translations";

export default function RootLayout() {
  const { primaryColor, theme, language } = useSettings();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === "index") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "marker") {
            iconName = focused ? "checkbox" : "checkbox-outline";
          } else if (route.name === "prayer") {
            // Use mosque icon from MaterialCommunityIcons
            return (
              <View style={focused ? {
                backgroundColor: `${primaryColor}18`,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 6,
              } : {}}>
                <MaterialCommunityIcons name="mosque" size={focused ? 22 : 20} color={color} />
              </View>
            );
          } else if (route.name === "summary") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          } else if (route.name === "blacklist") {
            return (
              <View style={focused ? {
                backgroundColor: '#DC262618',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 6,
              } : {}}>
                <MaterialCommunityIcons name="account-cancel" size={focused ? 22 : 20} color={focused ? '#DC2626' : color} />
              </View>
            );
          } else if (route.name === "settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return (
            <View style={focused ? {
              backgroundColor: `${primaryColor}18`,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 6,
            } : {}}>
              <Ionicons name={iconName} size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: primaryColor || "#0EA5E9",
        tabBarInactiveTintColor: isDark ? "#475569" : "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          borderRadius: 24,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: isDark ? '#000' : '#64748B',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? '#334155' : 'transparent',
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen 
        name="index" 
        options={{ title: t("home", language) }}
      />
      <Tabs.Screen 
        name="marker" 
        options={{ title: t("mark", language) }}
      />
      <Tabs.Screen 
        name="prayer" 
        options={{ title: t("prayer", language) }}
      />
      <Tabs.Screen 
        name="summary" 
        options={{ title: t("summary", language) }}
      />
      <Tabs.Screen 
        name="blacklist" 
        options={{ 
          title: t("blacklist", language),
          tabBarActiveTintColor: '#DC2626',
        }}
      />
      <Tabs.Screen 
        name="settings" 
        options={{ title: t("settings", language) }}
      />
    </Tabs>
  );
}
