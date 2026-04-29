import { ActivityIndicator, Text, View } from "react-native";
import '../global.css';
import { useEffect, useState } from "react";
import { getSigleData, storeData } from "../services/asyncStorage";
import { readUserData } from "../services/firebase_crud";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {

  const [user, setUser] = useState(false)
  const [langSelected, setLangSelected] = useState(null) // null = loading, true/false

  useEffect(()=>{
    const init = async () => {
      // Check if language was already selected
      const langDone = await AsyncStorage.getItem('app_langSelected');
      setLangSelected(langDone === 'true');

      getSigleData('userName').then((res)=>{
        setUser(res)
      });

      // Fetch and update initialData in the background on app start
      readUserData("initialData").then((res) => {
        if(res) {
          storeData(res, "initialData");
        }
      }).catch(err => console.error("Failed to fetch initial data", err));
    };
    init();
  },[])

  if (user === false || langSelected === null) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text>Loading...</Text>
        </View>
    );
  }

  // First launch: go to language selection
  if (!langSelected) {
    return (<Redirect href="/languageSelect"/>)
  }

  return (<Redirect href={user ? "/(tabs)":"/login"}/>)
}
