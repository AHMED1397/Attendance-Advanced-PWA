import React from 'react';
import { Platform, View, TextInput } from 'react-native';

/**
 * Cross-platform DatePicker.
 * - On Android/iOS: renders the native RNDateTimePicker.
 * - On Web: renders an HTML <input type="date"> styled to match the app.
 *
 * Props:
 *   value      - Date object (required)
 *   onChange   - (event, selectedDate) => void (same signature as RNDateTimePicker)
 *   mode       - 'date' | 'time' (default: 'date')
 *   display    - 'default' | 'spinner' | 'inline' (ignored on web)
 *   ...rest    - any other props forwarded to native picker
 */
const DatePickerCross = ({ value, onChange, mode = 'date', display, isDark, ...rest }) => {
  if (Platform.OS === 'web') {
    // Format date as YYYY-MM-DD for the HTML input
    const formatForInput = (d) => {
      if (!d) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return (
      <View style={{ marginVertical: 8 }}>
        <input
          type="date"
          value={formatForInput(value)}
          onChange={(e) => {
            const selectedDate = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
            if (onChange && selectedDate) {
              onChange({ type: 'set' }, selectedDate);
            }
          }}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 12,
            border: `1.5px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            color: isDark ? '#F8FAFC' : '#0F172A',
            fontSize: 15,
            fontFamily: 'inherit',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            boxSizing: 'border-box',
          }}
        />
      </View>
    );
  }

  // Native (Android / iOS)
  const RNDateTimePicker = require('@react-native-community/datetimepicker').default;
  return (
    <RNDateTimePicker
      value={value}
      mode={mode}
      display={display || (Platform.OS === 'ios' ? 'inline' : 'default')}
      onChange={onChange}
      {...rest}
    />
  );
};

export default DatePickerCross;
