import { View, Text, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { getData } from '../../services/asyncStorage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

const Marker = () => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await getData('initialData');
      if (data !== null) {
        setClasses(data.classes);
        setSubjects(data.subjects);
      }
    };

    fetchInitialData();
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowPicker(false);
  };

  const detailsPasser = () => {
    if (className === '' || subject === '') {
      alert('Please fill the form');
      return;
    }
    const data = { date: date.toDateString(), className, subject };
    router.push({
      pathname: '/attendanceTable',
      params: data,
    });
  };

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <Text className="text-3xl font-bold text-center my-4">Mark Attendance</Text>

      {/* Date Picker */}
      <View className="mt-4">
        <Text className="text-gray-600">🗓️ Date</Text>
        <TouchableOpacity
          className="bg-gray-100 p-3 rounded-lg mt-2"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-lg">{date.toDateString()}</Text>
        </TouchableOpacity>
        {showPicker && (
          <RNDateTimePicker
            mode="date"
            value={date}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
          />
        )}
      </View>

      {/* Class Selector */}
      <View className="mt-4">
        <Text className="text-gray-600">🏫 Select Class</Text>
        <Picker
          selectedValue={className}
          onValueChange={(itemValue) => setClassName(itemValue)}
        >
           <Picker.Item label="Select Class" value="" />
          {classes.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Subject Selector */}
      <View className="mt-4">
        <Text className="text-gray-600">📘 Select Subject</Text>
        <Picker
          selectedValue={subject} // Corrected: Use `subject` instead of `subjects`
          onValueChange={(itemValue) => setSubject(itemValue)}
        >
          <Picker.Item label="Select Subject" value="" />
          {subjects.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        className="bg-blue-500 p-3 mt-6 rounded-lg"
        onPress={detailsPasser}
      >
        <Text className="text-white text-lg text-center">Next →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Marker;