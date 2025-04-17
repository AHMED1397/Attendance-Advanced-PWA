import { View, Text, SafeAreaView, TouchableOpacity, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { getData } from '../../services/asyncStorage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

const Summary = () => {

  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const router = useRouter();


  const fetchInitialData = async () => {
    const data = await getData('initialData');
    if (data !== null) {
      setClasses(data.classes);
      setSubjects(data.subjects);
    }
  };
  useEffect(() => {
    fetchInitialData();
  }, []);

  const onFromDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setFromDate(selectedDate);
    }
    setShowFromPicker(false);
  };
  
  const onToDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setToDate(selectedDate);
    }
    setShowToPicker(false);
  };

  const handleSummarySearch = () => {
    if (className === '' || subject === '') {
      alert('Please select all fields');
      return;
    }
    router.push({
        pathname: '/summaryTable',
        params: {
          fromDate: fromDate.toDateString(),
          toDate: toDate.toDateString(),
          className: className,
          subject: subject,
        },
      });
  };


  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <Text className="text-3xl font-bold text-center my-4">Summary Screen</Text>

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

      {/* From Date Picker */}
      <View className="mt-4">
        <Text className="text-gray-600">📅 From Date</Text>
        <TouchableOpacity
          className="bg-gray-100 p-3 rounded-lg mt-2"
          onPress={() => setShowFromPicker(true)}
        >
          <Text className="text-lg">{fromDate.toDateString()}</Text>
        </TouchableOpacity>
        {showFromPicker && (
          <RNDateTimePicker
            mode="date"
            value={fromDate}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onFromDateChange}
          />
        )}
      </View>

      {/* To Date Picker */}
      <View className="mt-4">
        <Text className="text-gray-600">📅 To Date</Text>
        <TouchableOpacity
          className="bg-gray-100 p-3 rounded-lg mt-2"
          onPress={() => setShowToPicker(true)}
        >
          <Text className="text-lg">{toDate.toDateString()}</Text>
        </TouchableOpacity>
        {showToPicker && (
          <RNDateTimePicker
            mode="date"
            value={toDate}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onToDateChange}
          />
        )}
      </View>


      {/* Search Button */}
      <TouchableOpacity
        className="bg-green-500 p-3 mt-6 rounded-lg"
        onPress={handleSummarySearch}
      >
        <Text className="text-white text-lg text-center">Search Summary →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default Summary