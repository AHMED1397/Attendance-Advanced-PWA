import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="attendanceTable" options={{headerShown : false}} />
      <Stack.Screen name="summaryTable" options={{headerShown : false}} />
      <Stack.Screen name="editTable" options={{headerShown : false}} />
      <Stack.Screen name="timeTable" options={{headerShown : false}} />
    </Stack>
  );
}