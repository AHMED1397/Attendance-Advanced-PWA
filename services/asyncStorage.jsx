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
    return error;
  }
};

const storeAttendance = async (attendance) => {
  const existingData = await getData("attendanceDetails");
  if (existingData === null) {
    // If no data exists, store the new data directly
    await storeData([attendance], "attendanceDetails");
  } else {
    // If data exists, merge the new data with the existing data
    const updatedData = [...existingData, attendance];
    await storeData(updatedData, "attendanceDetails");
    storeinFB(JSON.parse(attendance.Teacher).name, updatedData);
  }
};

const storeinFB = async (userName, updatedData) => {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    await writeUserData(`attendanceDetails/${userName}`, updatedData);
  }
};

const updateinFB = async (userName, id, updatedAttendance) => {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    await updateUserData(userName, id, updatedAttendance);
  }
};

export { storeSingleData, storeData, getSigleData, getData, storeAttendance, updateinFB };
