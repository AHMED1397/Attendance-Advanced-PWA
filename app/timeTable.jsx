import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { getData, storeData } from '../services/asyncStorage';

const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const periods = 8;
const subjects = ['Math', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Free Period'];
const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'];

const TimetableScreen = () => {
  const [timetable, setTimetable] = useState({});

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      // Retrieve the timetable from AsyncStorage
      const storedData = await  getData('school_timetable');
      if (storedData) {
        setTimetable(JSON.parse(storedData));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load timetable.');
    }
  };

  const saveTimetable = async () => {
    for (let day of days) {
      for (let i = 1; i <= periods; i++) {
        if (!timetable[day]?.[i]?.subject || !timetable[day]?.[i]?.class) {
          Alert.alert('Error', `Please select a subject and class for ${day}, Period ${i}`);
          return;
        }
      }
    }
    try {
      await storeData(JSON.stringify(timetable), 'school_timetable');
      Alert.alert('Success', 'Timetable saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save timetable.');
    }
  };

  const handleInputChange = (day, period, key, value) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [period]: {
          ...(prev[day]?.[period] || {}),
          [key]: value,
        },
      },
    }));
  };

  return (
    <ScrollView className="p-6 bg-gray-100 min-h-screen">
      <Text className="text-3xl font-extrabold text-center text-blue-600 mb-6">School Timetable</Text>
      {days.map((day) => (
        <View key={day} className="mb-8 p-6 bg-white shadow-lg rounded-xl">
          <Text className="text-2xl font-bold text-gray-800 mb-4">{day}</Text>
          {Array.from({ length: periods }, (_, i) => (
            <View key={i} className="mb-6 bg-gray-50 p-4 rounded-lg shadow">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Period {i + 1}:</Text>
              <Picker
                selectedValue={timetable[day]?.[i + 1]?.subject || ''}
                onValueChange={(value) => handleInputChange(day, i + 1, 'subject', value)}
                className="border border-gray-300 rounded-lg p-3 bg-white"
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((subject) => (
                  <Picker.Item key={subject} label={subject} value={subject} />
                ))}
              </Picker>
              <Picker
                selectedValue={timetable[day]?.[i + 1]?.class || ''}
                onValueChange={(value) => handleInputChange(day, i + 1, 'class', value)}
                className="border border-gray-300 rounded-lg p-3 bg-white mt-2"
              >
                <Picker.Item label="Select Class" value="" />
                {classes.map((classItem) => (
                  <Picker.Item key={classItem} label={classItem} value={classItem} />
                ))}
              </Picker>
            </View>
          ))}
        </View>
      ))}
      <TouchableOpacity className="bg-blue-600 mb-20 p-5 rounded-xl shadow-xl" onPress={saveTimetable}>
        <Text className="text-white text-center text-lg font-bold">Save Timetable</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TimetableScreen;
