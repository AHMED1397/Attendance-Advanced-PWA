import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingsContext = createContext({});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState("light"); // 'light' or 'dark'
  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [fontSize, setFontSize] = useState("medium"); // 'small', 'medium', 'large'
  const [fontFamily, setFontFamily] = useState("System");
  const [language, setLanguage] = useState("en"); // 'en' or 'ar'

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("app_theme");
        const storedColor = await AsyncStorage.getItem("app_primaryColor");
        const storedFontSize = await AsyncStorage.getItem("app_fontSize");
        const storedFontFamily = await AsyncStorage.getItem("app_fontFamily");
        const storedLanguage = await AsyncStorage.getItem("app_language");

        if (storedTheme) setTheme(storedTheme);
        if (storedColor) setPrimaryColor(storedColor);
        if (storedFontSize) setFontSize(storedFontSize);
        if (storedFontFamily) setFontFamily(storedFontFamily);
        if (storedLanguage) setLanguage(storedLanguage);
      } catch (e) {
        console.log("Error loading settings", e);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (key, value) => {
    try {
      await AsyncStorage.setItem(`app_${key}`, value);
      if (key === "theme") setTheme(value);
      if (key === "primaryColor") setPrimaryColor(value);
      if (key === "fontSize") setFontSize(value);
      if (key === "fontFamily") setFontFamily(value);
      if (key === "language") setLanguage(value);
    } catch (e) {
      console.log("Error saving setting", e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{ theme, primaryColor, fontSize, fontFamily, language, saveSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
