import React, { useEffect } from 'react';
import { View, useColorScheme, I18nManager } from 'react-native';
import { useSettings } from '../services/SettingsContext';

const AppWrapper = ({ children }) => {
  const { theme, primaryColor, fontSize, fontFamily, language } = useSettings();

  // Sync RTL direction with language setting
  useEffect(() => {
    const shouldBeRTL = language === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      I18nManager.allowRTL(shouldBeRTL);
    }
  }, [language]);
  const systemTheme = useColorScheme();

  const activeTheme = theme === 'system' ? systemTheme : theme;
  const isDark = activeTheme === 'dark';

  // Determine font scaling
  let scale = 1;
  if (fontSize === 'small') scale = 0.85;
  if (fontSize === 'large') scale = 1.2;

  // CSS variables injected into the root view. NativeWind v4 supports this.
  const styleVars = {
    '--color-primary': primaryColor,
    '--color-primary-dark': shadeColor(primaryColor, -20),
    '--color-primary-light': shadeColor(primaryColor, 40),
    '--theme-bg': isDark ? '#0F172A' : '#F8FAFC',
    '--theme-surface': isDark ? '#1E293B' : '#FFFFFF',
    '--theme-text-main': isDark ? '#F8FAFC' : '#0F172A',
    '--theme-text-sub': isDark ? '#94A3B8' : '#64748B',
    '--font-size-scale': scale,
    '--font-family-main': fontFamily,
  };

  return (
    <View style={[{ flex: 1, backgroundColor: styleVars['--theme-bg'] }, styleVars]}>
      {children}
    </View>
  );
};

// Quick helper to lighten/darken hex colors for related palette
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;  
  G = (G<255)?G:255;  
  B = (B<255)?B:255;  

  const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

export default AppWrapper;
