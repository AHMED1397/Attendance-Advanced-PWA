import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateQadrProgress } from '../services/qadrConfig';
import { writeUserData } from '../services/firebase_crud';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Animated Progress Bar Component ───
const AnimatedProgressBar = ({
  percentage,
  midPercentage,
  startLabel,
  endLabel,
  barColor,
  midColor = '#F59E0B',
  midLabel = 'النصفي',
  showMidMarker = true,
  isDark,
  delay = 0,
  height = 28,
}) => {
  const fillWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withDelay(
      delay,
      withTiming(percentage, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    glowOpacity.value = withDelay(
      delay + 800,
      withTiming(1, { duration: 600 })
    );
  }, [percentage]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, fillWidth.value))}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.6,
  }));

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Labels */}
      {(startLabel || endLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 }}>
          <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: '600' }}>{startLabel}</Text>
          <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: '600' }}>{endLabel}</Text>
        </View>
      )}

      {/* Bar */}
      <View style={{ height, position: 'relative' }}>
        {/* Track */}
        <View style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: height / 2,
          overflow: 'hidden',
        }}>
          {/* Animated fill */}
          <Animated.View style={[{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            backgroundColor: barColor, borderRadius: height / 2,
          }, fillStyle]}>
            {/* Glow effect at the edge */}
            <Animated.View style={[{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 20,
              backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: height / 2,
            }, glowStyle]} />
          </Animated.View>

          {/* Percentage text */}
          {percentage > 12 && (
            <Animated.View style={[{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              justifyContent: 'center', alignItems: 'flex-end', paddingRight: 10,
            }, fillStyle]}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                {percentage.toFixed(0)}%
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Mid-year marker */}
        {showMidMarker && midPercentage > 0 && midPercentage < 100 && (
          <View style={{
            position: 'absolute', left: `${midPercentage}%`, top: -10, bottom: -4,
            alignItems: 'center', width: 20, marginLeft: -10,
          }}>
            <View style={{
              width: 12, height: 12, backgroundColor: midColor, borderRadius: 3,
              transform: [{ rotate: '45deg' }], shadowColor: midColor, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,
            }} />
            <View style={{ flex: 1, width: 2.5, backgroundColor: midColor, borderRadius: 2, marginTop: -2 }} />
          </View>
        )}
      </View>

      {/* Mid label */}
      {showMidMarker && midPercentage > 0 && midPercentage < 100 && (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Text style={{ color: midColor, fontSize: 9, fontWeight: 'bold' }}>{midLabel}</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Modal ───
const QadrProgressModal = ({ visible, onClose, config, className, primaryColor, isDark, date }) => {
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Thafseer state
  const [ayahInput, setAyahInput] = useState('');

  useEffect(() => {
    if (visible && config) {
      setInputValue('');
      setAyahInput('');
      if (config.type === 'thafseer') {
        const progress = config.currentProgress || {};
        if (progress.currentAyah > 0) {
          setAyahInput(progress.currentAyah.toString());
        }
      }
    }
  }, [visible, config]);

  if (!config) return null;

  const isHadees = config.type === 'hadees' || !config.type;
  const progressData = calculateQadrProgress(config);

  // Thafseer active surah calculation
  let activeSurah = null;
  let maxAyah = 0;
  let allSurahs = [];
  if (!isHadees && config.surahDetails) {
    allSurahs = Object.keys(config.surahDetails).sort((a, b) =>
      (config.surahDetails[a].order || 0) - (config.surahDetails[b].order || 0)
    );
    const completedSurahs = progressData.completedSurahs || [];
    activeSurah = progressData.currentSurah;
    if (!activeSurah) {
      activeSurah = allSurahs.find(s => !completedSurahs.includes(s));
    }
    maxAyah = activeSurah ? (config.surahDetails[activeSurah]?.ayahCount || 0) : 0;
  }

  // Determine firebase subject key
  const getSubjectKey = () => {
    if (config._subjectKey) return config._subjectKey;
    return isHadees ? 'الحديث' : 'التفسير';
  };

  // ─── HADEES SAVE ───
  const handleHadeesSave = async () => {
    const num = parseInt(inputValue, 10);
    if (!num || num < config.start || num > config.end) {
      alert(`الرجاء إدخال رقم بين ${config.start} و ${config.end}`);
      return;
    }
    setSaving(true);
    try {
      await writeUserData(`qadrPlans/${className}/${getSubjectKey()}/currentProgress`, num);
      setSaving(false);
      onClose(true);
    } catch (e) {
      console.error('Error saving hadees progress:', e);
      setSaving(false);
    }
  };

  // ─── THAFSEER SAVE ───
  const handleThafseerSave = async () => {
    if (!activeSurah) {
      alert('تم الانتهاء من جميع السور!');
      return;
    }
    const surahDetails = config.surahDetails || {};
    const ayahNum = parseInt(ayahInput, 10) || 0;

    if (ayahNum < 0 || ayahNum > maxAyah) {
      alert(`الرجاء إدخال رقم آية بين 0 و ${maxAyah}`);
      return;
    }

    setSaving(true);
    try {
      const selectedOrder = surahDetails[activeSurah]?.order || 0;
      const completedSurahs = allSurahs.filter(s => (surahDetails[s]?.order || 0) < selectedOrder);

      if (ayahNum >= maxAyah) {
        completedSurahs.push(activeSurah);
      }

      const progressUpdate = {
        completedSurahs,
        currentSurah: ayahNum >= maxAyah ? null : activeSurah,
        currentAyah: ayahNum >= maxAyah ? 0 : ayahNum,
      };

      await writeUserData(`qadrPlans/${className}/${getSubjectKey()}/currentProgress`, progressUpdate);
      setSaving(false);
      onClose(true);
    } catch (e) {
      console.error('Error saving thafseer progress:', e);
      setSaving(false);
    }
  };

  const handleSkip = () => onClose(false);

  // Colors
  const midColor = '#F59E0B';
  const examColor = '#8B5CF6';
  const bgColor = isDark ? '#1E293B' : '#FFFFFF';
  const cardBg = isDark ? '#0F172A' : '#F8FAFC';
  const textMain = isDark ? '#F8FAFC' : '#0F172A';
  const textSub = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#1E293B' : '#F1F5F9';
  const inputBorder = isDark ? '#334155' : '#E2E8F0';

  // ═══════════════════════════════════════
  // HADEES UI
  // ═══════════════════════════════════════
  const renderHadeesContent = () => {
    const p = progressData;
    return (
      <>
        {/* Stats Row */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12, marginRight: 6, alignItems: 'center' }}>
              <Text style={{ color: primaryColor, fontSize: 18, fontWeight: 'bold' }}>{p.currentNumber}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>آخر حديث</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12, marginHorizontal: 3, alignItems: 'center' }}>
              <Text style={{ color: p.isPastMid ? '#10B981' : midColor, fontSize: 18, fontWeight: 'bold' }}>{config.midYearEnd}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>هدف النصفي</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12, marginLeft: 6, alignItems: 'center' }}>
              <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 'bold' }}>{p.remaining}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>المتبقي</Text>
            </View>
          </View>

          {/* ── Progress Bar 1: Whole Year ── */}
          <View style={{ marginBottom: 4 }}>
            <Text style={{ color: textMain, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
              📊 التقدم السنوي  •  {p.wholeYearPercentage.toFixed(1)}%
            </Text>
            <AnimatedProgressBar
              percentage={p.wholeYearPercentage}
              midPercentage={p.midPercentage}
              startLabel={`${config.start}`}
              endLabel={`${config.end}`}
              barColor={primaryColor}
              midColor={midColor}
              showMidMarker={true}
              isDark={isDark}
              delay={300}
            />
          </View>

          {/* ── Progress Bar 2: Current Exam ── */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: textMain, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
              📝 الامتحان {p.examLabel}  •  {p.examPercentage.toFixed(1)}%
            </Text>
            <AnimatedProgressBar
              percentage={p.examPercentage}
              midPercentage={0}
              startLabel={`${p.examStart}`}
              endLabel={`${p.examEnd}`}
              barColor={examColor}
              showMidMarker={false}
              isDark={isDark}
              delay={600}
            />
          </View>
        </Animated.View>

        {/* Input */}
        <Animated.View entering={FadeIn.delay(400).duration(400)} style={{ marginTop: 20 }}>
          <Text style={{ color: textMain, fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
            آخر حديث درّسته اليوم؟
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg,
            borderRadius: 16, borderWidth: 2, borderColor: inputBorder,
            paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
          }}>
            <Ionicons name="bookmark-outline" size={18} color={primaryColor} style={{ marginRight: 10 }} />
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={`أدخل رقم الحديث (${config.start} - ${config.end})`}
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={{ flex: 1, fontSize: 16, fontWeight: '600', color: textMain, textAlign: 'right' }}
            />
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeIn.delay(500).duration(400)} style={{ marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleHadeesSave}
            disabled={saving}
            style={{
              backgroundColor: primaryColor, borderRadius: 16, padding: 16,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
              opacity: saving ? 0.7 : 1,
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
              {saving ? 'جاري الحفظ...' : 'حفظ و متابعة'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSkip}
            style={{ marginTop: 10, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: cardBg }}
            activeOpacity={0.7}
          >
            <Text style={{ color: textSub, fontSize: 14, fontWeight: '600' }}>تخطي</Text>
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  };

  // ═══════════════════════════════════════
  // THAFSEER UI
  // ═══════════════════════════════════════
  const renderThafseerContent = () => {
    const p = progressData;
    const surahDetails = config.surahDetails || {};

    return (
      <>
        {/* Stats Row */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12, marginRight: 6, alignItems: 'center' }}>
              <Text style={{ color: primaryColor, fontSize: 18, fontWeight: 'bold' }}>{p.completedSurahs.length}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>سور مكتملة</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12, marginHorizontal: 3, alignItems: 'center' }}>
              <Text style={{ color: midColor, fontSize: 18, fontWeight: 'bold' }}>{config.totalSurahs}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>إجمالي السور</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12, marginLeft: 6, alignItems: 'center' }}>
              <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 'bold' }}>{p.completedPages.toFixed(1)}/{p.totalPages}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>الصفحات (توقعي)</Text>
            </View>
          </View>

          {/* ── Progress Bar 1: Whole Year ── */}
          <View style={{ marginBottom: 4 }}>
            <Text style={{ color: textMain, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
              📊 التقدم السنوي  •  {p.wholeYearPercentage.toFixed(1)}%
            </Text>
            <AnimatedProgressBar
              percentage={p.wholeYearPercentage}
              midPercentage={p.midPercentage}
              startLabel=""
              endLabel={`${p.totalPages} صفحة`}
              barColor={primaryColor}
              midColor={midColor}
              showMidMarker={true}
              isDark={isDark}
              delay={300}
            />
          </View>

          {/* ── Progress Bar 2: Current Exam ── */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: textMain, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
              📝 الامتحان {p.examLabel}  •  {p.examPercentage.toFixed(1)}%
            </Text>
            <AnimatedProgressBar
              percentage={p.examPercentage}
              midPercentage={0}
              startLabel=""
              endLabel={`${p.examTotalPages} صفحة`}
              barColor={examColor}
              showMidMarker={false}
              isDark={isDark}
              delay={600}
            />
          </View>
        </Animated.View>

        {/* Current Active Surah Card */}
        {activeSurah ? (
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={{ marginTop: 16 }}>
             <Text style={{ color: midColor, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' }}>
              السورة الحالية (ترتيب: {surahDetails[activeSurah]?.order})
            </Text>
            <View style={{
              backgroundColor: primaryColor + '15',
              borderRadius: 16, padding: 16,
              borderWidth: 2, borderColor: primaryColor,
              marginBottom: 16
            }}>
              <Text style={{ color: textMain, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
                سورة {activeSurah}
              </Text>
              <Text style={{ color: textSub, fontSize: 12, textAlign: 'center' }}>
                إجمالي الآيات: {maxAyah} آية
              </Text>
            </View>

            <Text style={{ color: textMain, fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
              آخر آية درّستها في سورة {activeSurah}؟
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg,
              borderRadius: 16, borderWidth: 2, borderColor: primaryColor + '40',
              paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
            }}>
              <Ionicons name="bookmark-outline" size={18} color={primaryColor} style={{ marginRight: 10 }} />
              <TextInput
                value={ayahInput}
                onChangeText={setAyahInput}
                placeholder={`أدخل رقم الآية (1 - ${maxAyah})`}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                style={{ flex: 1, fontSize: 16, fontWeight: '600', color: textMain, textAlign: 'right' }}
              />
            </View>
          </Animated.View>
        ) : (
           <Animated.View entering={FadeIn.delay(400).duration(400)} style={{ marginTop: 16, alignItems: 'center', padding: 20 }}>
              <Ionicons name="trophy" size={48} color="#10B981" style={{marginBottom: 10}}/>
              <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 'bold' }}>تم ختم جميع السور المقررة!</Text>
           </Animated.View>
        )}

        {/* Buttons */}
        <Animated.View entering={FadeIn.delay(500).duration(400)} style={{ marginTop: 20 }}>
          {activeSurah && (
            <TouchableOpacity
              onPress={handleThafseerSave}
              disabled={saving}
              style={{
                backgroundColor: primaryColor, borderRadius: 16, padding: 16,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                opacity: saving ? 0.7 : 1,
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
                {saving ? 'جاري الحفظ...' : 'حفظ و متابعة'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSkip}
            style={{ marginTop: 10, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: cardBg }}
            activeOpacity={0.7}
          >
            <Text style={{ color: textSub, fontSize: 14, fontWeight: '600' }}>{activeSurah ? 'تخطي' : 'إغلاق'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleSkip}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center', alignItems: 'center', padding: 24,
        }}>
          <Animated.View
            entering={FadeInUp.duration(500).springify()}
            style={{
              backgroundColor: bgColor, borderRadius: 28, width: '100%', maxWidth: 400,
              maxHeight: '90%', overflow: 'hidden',
              shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
            }}
          >
            {/* Header */}
            <View style={{ backgroundColor: primaryColor, padding: 24, paddingBottom: 28, alignItems: 'center' }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <MaterialCommunityIcons
                  name={isHadees ? 'book-open-page-variant' : 'book-open-variant'}
                  size={26} color="white"
                />
              </View>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                {config.book}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                {isHadees
                  ? `المقرر: ${config.start} → ${config.end}`
                  : `المقرر: ${config.totalSurahs} سور`}
              </Text>
            </View>

            {/* Content */}
            <ScrollView
              style={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {isHadees ? renderHadeesContent() : renderThafseerContent()}
              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default QadrProgressModal;
