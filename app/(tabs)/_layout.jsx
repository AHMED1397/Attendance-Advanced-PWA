import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Import icons

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "index") {
            iconName = "home-outline";
          } else if (route.name === "marker") {
            iconName = "checkbox-outline";
          } else if (route.name === "summary") {
            iconName = "bar-chart-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4a90e2",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="marker" />
      <Tabs.Screen name="summary" />
    </Tabs>
  );
}
