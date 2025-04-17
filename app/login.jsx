import { View, Text, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { readUserData } from '../services/firebase_crud';
import { storeData } from '../services/asyncStorage';
import { Dropdown } from 'react-native-element-dropdown';
import { useRouter } from 'expo-router';

const Login = () => {
  const [initialData, setInitialData] = useState({});
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  useEffect(() => {
    readUserData("initialData")
      .then((res) => {
        storeData(res, "initialData");
        setInitialData(res);
      });
  }, []);

  const checker = () => {
    if (!username || !password) {
      alert('Please fill the form');
      return;
    }
    if (username.no !== password) {
      alert('Invalid password');
      return;
    }

    storeData(username, "userName");
    alert('Logged in');
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header Section */}
      <View className="px-6 pt-12">
        <Text className="text-3xl text-blue-700 font-bold">Welcome..!</Text>
        <Text className="text-lg text-gray-500 mt-2">Create New Account</Text>
      </View>

      {/* Form Section */}
      <View className="px-6 mt-8">
        {/* Dropdown for Teacher Selection */}
        <View className="mb-6">
          {initialData && (
            <Dropdown
              data={initialData.teacher}
              labelField="name"
              valueField="name"
              placeholder="Select your name"
              value={username}
              onChange={(v) => setUserName(v)}
              className="bg-gray-100 rounded-lg p-3 border border-gray-300"
              placeholderStyle={{ color: '#9CA3AF' }}
              selectedTextStyle={{ color: '#1F2937' }}
              itemTextStyle={{ color: '#1F2937' }}
            />
          )}
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-sm text-gray-700 mb-2">Password</Text>
          <TextInput
            className="bg-gray-100 rounded-lg p-3 border border-gray-300"
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={(e) => setPassword(e)}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="bg-blue-700 rounded-lg p-4 items-center"
          onPress={checker}
        >
          <Text className="text-white font-semibold">Login</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Section */}
      <View className="flex-1 justify-end px-6 pb-8">
        <Text className="text-center text-gray-500">
          Don't have an account?{' '}
          <Text className="text-blue-700 font-semibold">Complain Irshad Moulavi</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Login;