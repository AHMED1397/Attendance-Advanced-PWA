import { Stack } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
import Constants, { AppOwnership } from 'expo-constants';
import { SettingsProvider } from "../services/SettingsContext";
import AppWrapper from "../components/AppWrapper";

export default function RootLayout() {
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        if (Constants.appOwnership === AppOwnership.Expo) {
          console.log("Update check skipped: Running in Expo Go");
          return;
        }

        const Updates = require("expo-updates");
        
        if (!Updates.isEnabled) {
          console.log("Update check skipped: Updates module is disabled");
          return;
        }

        console.log("Checking for updates...");
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("Update found! Fetching...");
          await Updates.fetchUpdateAsync();
          Alert.alert(
            "Update Required",
            "A new version of the app has been downloaded. The app will now restart to apply it.",
            [
              { text: "Restart Now", onPress: () => Updates.reloadAsync() },
            ],
            { cancelable: false }
          );
        } else {
          console.log("No updates available.");
        }
      } catch (error) {
        console.log(`Error fetching latest Expo update: ${error}`);
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    } else {
      console.log("Update check skipped: Development mode (__DEV__ is true)");
    }
  }, []);

  return (
    <SettingsProvider>
      <AppWrapper>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="languageSelect" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="attendanceTable" options={{headerShown : false}} />
          <Stack.Screen name="summaryTable" options={{headerShown : false}} />
          <Stack.Screen name="editTable" options={{headerShown : false}} />
          <Stack.Screen name="timeTable" options={{headerShown : false}} />
          <Stack.Screen name="prayerTable" options={{headerShown : false}} />
          <Stack.Screen name="prayerAnalytics" options={{headerShown : false}} />
          <Stack.Screen name="classAnalytics" options={{headerShown : false}} />
          <Stack.Screen name="studentProfile" options={{headerShown : false}} />
          <Stack.Screen name="summarySearch" options={{headerShown : false}} />
          <Stack.Screen name="aboutDev" options={{headerShown : false}} />
        </Stack>
      </AppWrapper>
    </SettingsProvider>
  );
}