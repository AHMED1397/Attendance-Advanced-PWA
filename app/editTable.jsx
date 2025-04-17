import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Checkbox from 'expo-checkbox';
import { getData, storeData, updateinFB } from '../services/asyncStorage';

const EditTable = () => {
  const params = useLocalSearchParams();
  const { Date, Teacher, Class, Subject } = params;


  const [initialData, setInitialData] = useState({});
  const [Attendance,setAttendance] = useState (params.Attendance ? JSON.parse(params.Attendance) : {});

  useEffect(() => {
    getData('initialData').then((res) => {
      setInitialData(res);
    });
  }, []);

  const TableRow = (value) => {
    const rollNo = value.value.rollNo;
    const studentName = initialData?.students?.[Class]?.[rollNo] || "N/A";
    return (
      <View className="flex flex-row items-center p-3 border-b border-gray-200 bg-white">
        <Text className="w-1/6 text-center text-sm font-medium text-gray-700">{value.index + 1}</Text>
        <Text className="w-1/6 text-center text-sm font-medium text-gray-700">{rollNo}</Text>
        <Text className="w-3/6 text-center text-sm text-gray-600">{studentName}</Text>
        <View className="w-1/6">
          <Checkbox
            value={value.value.attendance}
            onValueChange={(newValue) => handleAttendanceChange(rollNo, newValue)}
            color={value.value.attendance ? '#3b82f6' : '#9ca3af'}
            className="w-5 h-5"
          />
        </View>
      </View>
    );
  };

  const handleAttendanceChange = (rollNo, newValue) => {
    const updatedAttendance = { ...Attendance, [rollNo]: newValue };
    setAttendance(updatedAttendance)
  };

  const saveChanges = async () =>{
    const updatedAttendance = {
      Attendance,
      Teacher,
      Date,
      Subject,
      Class,
    }
    getData('attendanceDetails').then((res) => {
      var id = null
      if (res !== null) {
        const updatedData = res.map((item, index) => {
          if (item.Date === Date && item.Subject === Subject && item.Class === Class) {
            id = index
            return updatedAttendance;
          }
          return item;
        });
        storeData(updatedData, "attendanceDetails",id, updatedAttendance);
        updateinFB(JSON.parse(updatedAttendance.Teacher).name, id , updatedAttendance);
        alert('Changes Saved Successfully!');
        router.navigate("/(tabs)")
    }
    })
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      {/* Header Section */}
      <View className="bg-blue-600 p-5 rounded-lg shadow-md mb-6">
        <Text className="text-2xl text-center font-bold text-white">
          {Class || "Loading..."}
        </Text>
        <Text className="text-base text-center text-blue-200 mt-1">
          ({Subject || "Loading..."})
        </Text>
      </View>

      {/* Table Section */}
      <ScrollView className="flex-1">
        {/* Table Header */}
        <View className="flex flex-row bg-blue-500 rounded-t-lg p-3">
          <Text className="text-center text-sm w-1/6 font-bold text-white">No</Text>
          <Text className="text-center text-sm w-1/6 font-bold text-white">Index</Text>
          <Text className="text-center text-sm w-3/6 font-bold text-white">Name</Text>
          <Text className="text-center text-sm w-1/6 font-bold text-white">Present</Text>
        </View>

        {/* Table Body */}
        <View className="bg-white rounded-b-lg shadow-sm">
          {Attendance && Object.entries(Attendance).length > 0 ? (
            Object.entries(Attendance).map(([rollNo, status], index) => (
              <TableRow key={index} value={{ rollNo, attendance: status }} index={index} />
            ))
          ) : (
            <Text className="text-center text-gray-500 py-4">No attendance data available</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity onPress={saveChanges} className=" bg-blue-600 mt-3 p-1 rounded-lg items-center" >
          <Text className="font-bold color-stone-50" >Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default EditTable;