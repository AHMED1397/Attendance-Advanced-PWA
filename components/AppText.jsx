import React from 'react';
import { Text } from 'react-native';
import { useSettings } from '../services/SettingsContext';

const AppText = ({ style, className, children, ...props }) => {
  const { fontFamily, fontSize } = useSettings();
  
  // A safe scaling approach for React Native using style multipliers 
  // NativeWind styles are passed in the style array often. We can try to rely on AppWrapper CSS vars.
  
  return (
    <Text 
      {...props} 
      className={className} 
      style={[
        { fontFamily: fontFamily === 'System' ? undefined : fontFamily },
        style
      ]}
    >
      {children}
    </Text>
  );
};

export default AppText;
