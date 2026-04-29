import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { updateUserData, writeUserData } from "./firebase_crud";

const storeSingleData = async (value, name) => {
  try {
    await AsyncStorage.setItem(name, value);
  } catch (e) {
    // saving error
  }
};

const storeData = async (value, name, index, updatedAttendance) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(name, jsonValue);
  } catch (e) {}
};

const getSigleData = async (name) => {
  try {
    const value = await AsyncStorage.getItem(name);
    if (value !== null) {
      return value;
    }
  } catch (e) {
    return null;
  }
};

const getData = async (name) => {
  try {
    const jsonValue = await AsyncStorage.getItem(name);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    return null;
  }
};

const storeAttendance = async (attendance) => {
  const attendanceWithSync = { ...attendance, synced: false };
  const existingData = await getData("attendanceDetails");
  
  let updatedData;
  if (existingData === null) {
    updatedData = [attendanceWithSync];
  } else {
    updatedData = [...existingData, attendanceWithSync];
  }
  
  await storeData(updatedData, "attendanceDetails");
  return await syncData();
};

const syncData = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    const allData = await getData("attendanceDetails");
    if (allData && allData.length > 0) {
      // Get userName from storage. Since it's stored as an object via storeData, we use getData
      const userData = await getData("userName");
      const teacherName = userData ? userData.name : (allData[0].Teacher ? JSON.parse(allData[0].Teacher).name : null);
      
      if(teacherName) {
        try {
            // Upload ALL data to overwrite/update Firebase
            await writeUserData(`attendanceDetails/${teacherName}`, allData);
            
            // Mark all as synced
            const syncedData = allData.map(item => ({ ...item, synced: true }));
            await storeData(syncedData, "attendanceDetails");
            return true; // Sync success
        } catch (error) {
            console.log("Sync failed", error);
            return false;
        }
      }
    }
  }
  return false;
};

const getPendingCount = async () => {
    const data = await getData("attendanceDetails");
    if (!data) return 0;
    return data.filter(item => item.synced === false).length;
};

// Prayer storage functions
const storePrayer = async (prayerRecord) => {
  const recordWithSync = { ...prayerRecord, synced: false };
  const existingData = await getData("prayerDetails");
  
  let updatedData;
  if (existingData === null) {
    updatedData = [recordWithSync];
  } else {
    updatedData = [...existingData, recordWithSync];
  }
  
  await storeData(updatedData, "prayerDetails");
  return await syncPrayerData();
};

const syncPrayerData = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    const allData = await getData("prayerDetails");
    if (allData && allData.length > 0) {
      const userData = await getData("userName");
      const teacherName = userData ? userData.name : null;
      
      if (teacherName) {
        try {
          await writeUserData(`prayerDetails/${teacherName}`, allData);
          const syncedData = allData.map(item => ({ ...item, synced: true }));
          await storeData(syncedData, "prayerDetails");
          return true;
        } catch (error) {
          console.log("Prayer sync failed", error);
          return false;
        }
      }
    }
  }
  return false;
};

const getPrayerPendingCount = async () => {
  const data = await getData("prayerDetails");
  if (!data) return 0;
  return data.filter(item => item.synced === false).length;
};

// Deprecated or Unused internal helper replaced by syncData logic, keeping for compatibility if needed elsewhere but likely not.
const updateinFB = async (userName, id, updatedAttendance) => {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    await updateUserData(userName, id, updatedAttendance);
  }
};

export { storeSingleData, storeData, getSigleData, getData, storeAttendance, updateinFB, syncData, getPendingCount, storePrayer, syncPrayerData, getPrayerPendingCount };

