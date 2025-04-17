import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { getData } from '../../services/asyncStorage';
import { Calendar } from 'react-native-calendars';
import PieChart from 'react-native-pie-chart';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';

const Index = () => {
  const [date, setDate] = useState(new Date());
  const [userName, setUserName] = useState(null);
  const [showCalender, setShowCalender] = useState(false);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [timeTable,setTimetable] = useState({})
  const [calender,setCalender] = useState({
    present :[],
    absent:[],
    noResult:[]
    })

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const router = useRouter();


  const fetchUserName = async () => {
    const name = await getData('userName');
    if (name !== null) {
      setUserName(name.name);
    }
  };

  const fetchTimeTable = async () => {
    const timeTable = await getData('school_timetable');
    if (timeTable !== null) {
      setTimetable(timeTable);
      console.log("time table",timeTable)
    }

  }
  const fetchAttendanceDetails = async () => {
    const Details = await getData('attendanceDetails');
    if (Details !== null) {
      setAttendanceDetails(Details);
    }
  };

  const fetchMonthlyDetails = async () => {
    const monthDetails = await getData('monthDetails');
    if (monthDetails === null) {
      const monthDetails = Array(daysInMonth[date.getMonth()]).fill(null);
      const monthDays = Array(daysInMonth[date.getMonth()]).fill(0).map((_, i) => {
        return `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${i + 1 < 10 ? `0${i + 1}` : i + 1}`;
      });
  
      const tempCalender = { present: [], absent: [], noResult: [] };
  
      monthDays.forEach((day, index) => {
        const status = monthDetails[index];
        if (status === null) {
          tempCalender.noResult.push(day);
        } else if (status === "Present") {
          tempCalender.present.push(day);
        } else if (status === "Absent") {
          tempCalender.absent.push(day);
        }
      });
      setCalender(tempCalender);
    }
  };
  useEffect(() => {
    fetchUserName();
    fetchMonthlyDetails();
    fetchAttendanceDetails();
    fetchTimeTable();
  }, []);

  const editor = (item) => {
    router.push({
      pathname: "/editTable",
      params: {
        Date: item.Date,
        Teacher: item.Teacher,
        Class: item.Class,
        Subject: item.Subject,
        Attendance: JSON.stringify(item.Attendance),
      },
    });
  };

  const getGreeting = () => {
    const hour = date.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <ScrollView>
        {/* Profile & Greeting */}
        <View className="flex flex-row items-center p-5 rounded-2xl mb-4 shadow-sm bg-blue-500">
            <View className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <MaterialIcons name="person" size={30} color="#4facfe" />
            </View>
            <View className="ml-4">
              <Text className="text-xs text-white">{getGreeting()}</Text>
              <Text className="text-2xl font-semibold text-white">Hi,{userName} 👋</Text>
            </View>
        </View>

        {/* Date Section */}
        <View className="bg-white shadow-lg p-5 rounded-2xl mb-4 flex flex-row items-center border-l-4 border-blue-500">
          <Text className="text-blue-600 text-5xl font-bold mr-4">{date.getDate()}</Text>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{days[date.getDay()]}</Text>
            <Text className="text-sm text-gray-500">{months[date.getMonth()]} {date.getFullYear()}</Text>
          </View>
          <MaterialIcons name="event" size={24} color="#4facfe" />
        </View>

        {/* Weekly Attendance Status */}
        <View className="bg-white shadow-lg p-5 rounded-2xl mb-4">
          {/* Header */}
          <View className="flex flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 font-semibold text-lg">📊 This Month's Status</Text>
            <TouchableOpacity className="bg-blue-50 px-3 py-1 rounded-full" onPress={()=>setShowCalender(!showCalender)}>
              <Text className="text-blue-600 text-sm">View Details</Text>
            </TouchableOpacity>
          </View>

          {showCalender && (
            <View>
              <View className="flex flex-row justify-between">
                <Text className="text-gray-500 text-sm mb-1">🟢Present: {calender.present.length}</Text>
                <Text className="text-gray-500 text-sm mb-1">🔴Absent: {calender.absent.length}</Text>
                <Text className="text-gray-500 text-sm mb-1">🟠No Result: {calender.noResult.length}</Text>
              </View>
              <Calendar
              markedDates={{
                ...Object.fromEntries(
                  calender.noResult.map((day) => [
                    day,
                    { marked: true, dotColor: 'orange', disableTouchEvent: true }
                  ])
                ),
                ...Object.fromEntries(
                  calender.present.map((day) => [
                    day,
                    { marked: true, dotColor: 'green', disableTouchEvent: true }
                  ])
                ),
                ...Object.fromEntries(
                  calender.absent.map((day) => [
                    day,
                    { marked: true, dotColor: 'red', disableTouchEvent: true }
                  ])
                )
              }}
              />
            </View>
          )}

          
          {(calender.present.length !== 0 || calender.absent.length !== 0) &&
          <PieChart 
          widthAndHeight={300}
          series={[{value : calender.present.length,
                    color: "yellow"}, 
                    {value : calender.absent.length,
                      color :"green"
                    }]}
        />}
        </View>
          
        {/*Next Lession*/}
      
        <View className="p-5 rounded-2xl shadow-lg">
          <View className="flex flex-row justify-between items-center">
            <Text className="text-white font-semibold text-lg mb-3">📖 Next Lesson</Text>
            <TouchableOpacity onPress={() => {router.push("/timeTable")}}>
              <Text className="text-white font-semibold text-lg mb-3"> ✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
          {timeTable[days[date.getDay()]] ? (
        Object.entries(todaysLessons).map(([key, value], index) => (
          <View
            key={index}
            className="flex flex-row items-center bg-gray-200 p-4 rounded-xl shadow-md"
          >
            <View className="h-16 w-16 bg-white rounded-xl flex items-center justify-center">
              <Ionicons name="book" size={32} color="#ff6a88" />
            </View>
            <View className="ml-4">
              <Text className="text-gray-700 font-semibold text-lg">
                {value[0]}
              </Text>
              <Text className="text-gray-500">{value[1]}</Text>
            </View>
          </View>
        ))
      ) : (
        <View className="flex flex-row items-center bg-gray-200 p-4 rounded-xl shadow-md">
          <View className="h-16 w-16 bg-white rounded-xl flex items-center justify-center">
            <Ionicons name="book" size={32} color="#ff6a88" />
          </View>
          <View className="ml-4">
            <Text className="text-gray-700 font-semibold text-lg">No Class</Text>
          </View>
        </View>
      )}
          </ScrollView>
        </View>

        {/* Class History Overview */}
        <View className="bg-gray-50 max-h-96 ">
          <View className="bg-white shadow-lg p-5 mt-4 rounded-2xl mb-4">
           <View className="flex flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Class History Overview & Edit</Text>
              <TouchableOpacity onPress={()=> fetchAttendanceDetails()}>
                <FontAwesome5 name="redo" className="mb-3" size={15} color="blue" />
              </TouchableOpacity>
           </View>
          
            {attendanceDetails && Array.isArray(attendanceDetails) && attendanceDetails.length > 0 ? (
              attendanceDetails.reverse().map((item, no) => (
                <TouchableOpacity  key={no} onPress={()=>editor(item)}>
                  <View className="bg-blue-50 shadow p-4 rounded-xl mb-3">
                    <Text className="text-gray-700 font-medium">Class:  {item.Class}</Text>
                    <Text className="text-gray-600">Subject:  {item.Subject}</Text>
                    <Text className="text-gray-500">Date:  {item.Date}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-gray-600">No classes available to display.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default Index