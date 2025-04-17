import { View, Text, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { getData } from '../services/asyncStorage';

const SummaryTable = () => {

    const {fromDate, toDate, className, subject} = useLocalSearchParams();
    const scrollViewRef = useRef(null);
    const height = Dimensions.get('window').height;

    const [students,setStudents] = useState([])
    const [attendanceDetails,setAttendanceDetails] = useState({})
    const [totalPeriods, setTotalPeriods] = useState(0);
    const [totalPresent, setTotalPresent] = useState(0);
    const [totalAbsent, setTotalAbsent] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    
    
    const fetchInitialData = async () => {
      try {
        const [data, result] = await Promise.all([
          getData('initialData'),
          getData('attendanceDetails')
        ]);
        data !== null  ? setStudents(Object.entries(data.students[className])) : setStudents([]);
        result !== null ? setAttendanceDetails(result) : setAttendanceDetails({}); 
        data !== null && result !== null ? setIsLoading(false) : setIsLoading(true);


      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const detailsMaker = (attendanceDetails) => {

      let filteredDetails = []; // Initialize as an empty array
      // Check if attendanceDetails is defined and is an array
      if (attendanceDetails && Array.isArray(attendanceDetails)) {
        // Filter the array based on the Date field
        filteredDetails = attendanceDetails.filter(record => {
          const recordDate = new Date(record.Date); // Convert the Date string to a Date object
          return recordDate >= new Date(fromDate) && recordDate <= new Date(toDate);
        });



      } else {
        console.error("attendanceDetails is invalid or not an array:", attendanceDetails);
      }

      setTotalPeriods(filteredDetails.length);

      const result = filteredDetails.reduce((acc, record) => {
          Object.entries(record.Attendance).forEach(([studentId, present]) => {
            if (present) {
              acc[studentId] = (acc[studentId] || 0) + 1;
            }else{
              acc[studentId] = (acc[studentId] || 0);
            }
          });
          return acc;
        }, {});
      setTotalPresent(result)     
      setTotalAbsent(filteredDetails.length - Object.values(result).reduce((a, b) => a + b, 0));                                                                                                                          
    };

    const TableRow = ({ item, present, periods }) => {
      const [rollNo, name] = item;

      return (
        <View className="flex flex-row justify-between bg-sky-100 py-4 border-b border-sky-300">
          <Text className="text-base text-sky-700 w-1/6 text-center font-semibold">{rollNo}</Text>
          <Text className="text-base text-sky-700 w-2/6 text-center">{name}</Text>
          <Text className="text-base text-sky-700 w-1/6 text-center">{present[rollNo]}</Text>
          <Text className="text-base text-sky-700 w-1/6 text-center">{periods-present[rollNo]}</Text>
          <Text className="text-base text-sky-700 w-1/6 text-center">{((present[rollNo]/periods)*100).toFixed(2)}%</Text>
        </View>
      );
    };


    useEffect(() => {
      fetchInitialData();
    }, []);

    useEffect(() => {
      isLoading !== true && detailsMaker(attendanceDetails);
    },[isLoading]);
    
    

    if (totalPeriods == 0 ){
      return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-2xl text-sky-700">No Data Found</Text>
          <Text className="text-lg text-sky-700">Please check the date range</Text>
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
          >
            <Text className="text-lg bg-sky-600 px-4 py-2 rounded mt-4 text-white">Go Back</Text>
          </TouchableOpacity>
        </View>

      )
    }else{
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#E0F7FA' }}>
          <View className="p-3 pt-5 bg-sky-600 shadow-md mb-6 text-center">
            <Text className="text-3xl text-center font-bold text-white">
              {className || 'Loading...'}
            </Text>
            <Text className="text-lg text-center text-sky-200 mt-1">
              ({subject || 'Loading...'})
            </Text>
            <Text className="text-lg text-center text-sky-200 mt-1">
              {fromDate}----{toDate}
            </Text>
          </View>
    
          <View className="mx-3" style={{ flex: 1 }}>
            <View className="flex flex-row justify-between bg-sky-400 rounded-t-lg text-white">
              <Text className="text-base font-bold w-1/6 text-center">Index</Text>
              <Text className="text-base font-bold w-2/6 text-center">Name</Text>
              <Text className="text-base font-bold w-1/6 text-center">Present</Text>
              <Text className="text-base font-bold w-1/6 text-center">Absent</Text>
              <Text className="text-base font-bold w-1/6 text-center">PCT%</Text>
            </View>
    
            {isLoading ? (
              <View className="p-6 flex justify-center items-center">
                <Text className="text-center text-gray-500">Loading...</Text>
              </View>
            ) : (
              <ScrollView ref={scrollViewRef} className="bg-white rounded-b-lg" style={{ maxHeight: height * 0.65 }}>
                {students.map((student, index) => (
                  <TableRow key={index} item={student}  present={totalPresent} periods={totalPeriods} />
                ))}
              </ScrollView>
            )}
    
            <View className="flex flex-row justify-center p-4 bg-sky-400 rounded-lg mt-4">
              <Text className="text-center text-base font-semibold">
                Total Periods: <Text className="text-[#ffffff]">{totalPeriods}</Text>
              </Text>
            </View> 
    
            
          </View>
        </SafeAreaView>
      )
    }
}

export default SummaryTable