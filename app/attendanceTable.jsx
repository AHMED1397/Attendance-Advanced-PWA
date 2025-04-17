import { View, Text, ScrollView, Dimensions, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getData, getSigleData, storeAttendance } from '../services/asyncStorage';
import Checkbox from 'expo-checkbox';

const AttendanceTable = () => {
  const params = useLocalSearchParams();
  const { date, className, subject } = params;

  const router =useRouter();

  const scrollViewRef = useRef(null);
  const { height } = Dimensions.get('window');

  const [initialData, setInitialData] = useState({});
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData('initialData');
        if (data) {
          setInitialData(data);
          if (data.students?.[className]) {
            const initialAttendance = {};
            Object.keys(data.students[className]).forEach((rollNo) => {
              initialAttendance[rollNo] = true; // Default value
            });
            setAttendance(initialAttendance);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchData();
  }, [className]);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const TableRow = ({ item, index }) => {
    const [rollNo, name] = item;
    return (
      <View className="flex flex-row justify-between bg-sky-100 p-4 border-b border-sky-300 items-center">
        <Text className="text-base text-sky-700 w-1/12 text-center font-semibold">
          {index + 1}
        </Text>
        <Text className="text-base text-sky-700 w-3/12 text-center font-semibold">
          {rollNo}
        </Text>
        <Text className="text-base text-sky-700 w-5/12 text-center pl-2">{name}</Text>
        <Checkbox
          value={attendance[rollNo]}
          onValueChange={(newValue) =>
            setAttendance((prevAttendance) => ({
              ...prevAttendance,
              [rollNo]: newValue,
            }))
          }
        />
      </View>
    );
  };


  const handleSubmit = async () => {
    storeAttendance({
      Teacher: await getSigleData('userName'),
      Date: date,
      Class: className,
      Subject: subject,
      Attendance: attendance,
    });
    alert('Data Submitted Successfully!');
    router.push('/(tabs)');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F7FA' }}>

      <View className="p-6 bg-sky-600 shadow-md rounded-lg mb-6 text-center">
        <Text className="text-3xl text-center font-bold text-white">
          {className || 'Loading...'}
        </Text>
        <Text className="text-lg text-center text-sky-200 mt-1">
          ({subject || 'Loading...'})
        </Text>
      </View>

      <View className="mx-5" style={{ flex: 1 }}>
        <View className="flex flex-row justify-between bg-sky-400 p-4 rounded-t-lg text-white">
          <Text className="text-xs font-bold w-1/12 text-center">No</Text>
          <Text className="text-xs font-bold w-3/12 text-center ml-4">Roll No.</Text>
          <Text className="text-xs font-bold w-5/12 text-center">Name</Text>
          <Text className="text-xs font-bold w-3/12 text-center">Status</Text>
        </View>

        {initialData.students?.[className] ? (

            <FlatList
              data={Object.entries(initialData.students[className])}
              renderItem={({ item, index }) => (
                <TableRow key={index} item={item} index={index} />
              )}
              keyExtractor={(item) => item[0]}
            />

        ) : (
          <View className="p-6 flex justify-center items-center">
            <Text className="text-center text-gray-500">No students found</Text>
          </View>
        )}
      </View>

      <View className="flex flex-row justify-around gap-5 p-4 bg-sky-400 rounded-lg mt-4">
        <Text className="text-center text-base font-semibold">
          Attendance:
          <Text className="text-[#ffffff]">
            {Object.values(attendance).filter(Boolean).length}/{Object.keys(initialData.students?.[className] || {}).length}
          </Text>
        </Text>
        <Text className="text-center text-base font-semibold">
          Absent:
          <Text className="text-[#ff0000]">
            {Object.keys(initialData.students?.[className] || {}).length - Object.values(attendance).filter(Boolean).length}
          </Text>
        </Text>
        <Text className="text-center text-base font-semibold">
          Percentage:
          <Text className="text-[#ffffff]">
            {Object.keys(initialData.students?.[className] || {}).length > 0
              ? `${((Object.values(attendance).filter(Boolean).length / Object.keys(initialData.students[className]).length) * 100).toFixed(2)}%`
              : '0%'}
          </Text>
        </Text>
      </View>

      <View className="flex flex-row justify-between m-2">
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-sky-600 p-3 rounded-md shadow-md w-5/12 items-center"
          >
            <Text className="text-white font-semibold">Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={scrollToTop}
            className="bg-sky-400 p-3 rounded-md shadow-md w-5/12 items-center"
          >
            <Text className="text-white font-semibold">Scroll to Top</Text>
          </TouchableOpacity>
      </View>      

    </View>
  );
};

export default AttendanceTable;