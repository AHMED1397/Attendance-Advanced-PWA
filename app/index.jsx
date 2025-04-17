import { ActivityIndicator, Text, View } from "react-native";
import '../global.css';
import { useEffect, useState } from "react";
import { getSigleData } from "../services/asyncStorage";
import { Redirect } from "expo-router";
export default function Index() {


  const [user, setUser] = useState(false)

  useEffect(()=>{
    getSigleData('userName').then((res)=>{
      setUser(res)
    })
  },[])
 

  if (user === false) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading...</Text>
        </View>
    );
}
return (<Redirect href={user ? "/(tabs)":"/login"}/>)
  
}
