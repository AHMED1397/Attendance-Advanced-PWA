import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateProgress, getProgressSavePath, clearQadrCache } from '../services/qadrConfig';
import { writeUserData } from '../services/firebase_crud';

// ─── Animated Progress Bar ───────────────────────────
const AnimatedProgressBar = ({
  percentage, midPercentage, startLabel, endLabel,
  barColor, midColor = '#F59E0B', showMidMarker = true,
  isDark, delay = 0, height = 28,
}) => {
  const fillWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withDelay(
      delay,
      withTiming(percentage, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    glowOpacity.value = withDelay(delay + 800, withTiming(1, { duration: 600 }));
  }, [percentage]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, fillWidth.value))}%`,
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.6 }));

  return (
    <View style={{ marginBottom: 8 }}>
      {(startLabel || endLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 }}>
          <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: '600' }}>{startLabel}</Text>
          <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: '600' }}>{endLabel}</Text>
        </View>
      )}
      <View style={{ height, position: 'relative' }}>
        <View style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: height / 2, overflow: 'hidden',
        }}>
          <Animated.View style={[{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            backgroundColor: barColor, borderRadius: height / 2,
          }, fillStyle]}>
            <Animated.View style={[{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 20,
              backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: height / 2,
            }, glowStyle]} />
          </Animated.View>
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
      {showMidMarker && midPercentage > 0 && midPercentage < 100 && (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Text style={{ color: midColor, fontSize: 9, fontWeight: 'bold' }}>النصفي</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Modal ──────────────────────────────────────
const QadrProgressModal = ({ visible, onClose, config, primaryColor, isDark }) => {
  const [inputValue, setInputValue] = useState('');
  const [ayahInput, setAyahInput] = useState('');
  const [saving, setSaving] = useState(false);
  // Multi-book: selected book index
  const [selectedBookIdx, setSelectedBookIdx] = useState(0);

  useEffect(() => {
    if (visible && config) {
      setInputValue('');
      setAyahInput('');
      if (config.books) {
        const progress = config.currentProgress;
        setSelectedBookIdx(
          (typeof progress === 'object' && progress?.bookIndex) || 0
        );
      }
      if (config.surahDetails) {
        const progress = config.currentProgress || {};
        if (progress.currentAyah > 0) setAyahInput(progress.currentAyah.toString());
      }
    }
  }, [visible, config]);

  if (!config) return null;

  // Build a "view config" for the calculator based on selected book + live input preview
  const getViewConfig = () => {
    let previewVal = config.currentProgress;

    if (config.surahDetails) {
      // For surah_ayah, preview the ayah being typed
      const activeSurah = calculateProgress(config).activeSurah;
      const ayahNum = parseInt(ayahInput, 10);
      if (!isNaN(ayahNum) && activeSurah) {
        previewVal = {
          ...(typeof config.currentProgress === 'object' ? config.currentProgress : {}),
          currentSurah: activeSurah,
          currentAyah: ayahNum,
        };
      }
    } else {
      // For number/multi-book, preview the number being typed
      const num = parseInt(inputValue, 10);
      if (!isNaN(num)) {
        if (config.books) {
          previewVal = {
            ...(typeof config.currentProgress === 'object' ? config.currentProgress : {}),
            bookIndex: selectedBookIdx,
            currentValue: num,
          };
        } else {
          previewVal = num;
        }
      } else if (config.books) {
        // If empty input but switched book tab
        previewVal = {
          ...(typeof config.currentProgress === 'object' ? config.currentProgress : {}),
          bookIndex: selectedBookIdx,
        };
      }
    }

    return { ...config, currentProgress: previewVal };
  };

  const p = calculateProgress(getViewConfig());

  // Colors
  const midColor = '#F59E0B';
  const examColor = '#8B5CF6';
  const bgColor = isDark ? '#1E293B' : '#FFFFFF';
  const cardBg = isDark ? '#0F172A' : '#F8FAFC';
  const textMain = isDark ? '#F8FAFC' : '#0F172A';
  const textSub = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#1E293B' : '#F1F5F9';
  const inputBorder = isDark ? '#334155' : '#E2E8F0';

  // ── Stats cards data (unified for all types) ──
  const getStats = () => {
    if (p.progressType === 'surah_ayah') {
      return [
        { value: p.completedSurahs.length, label: 'سور مكتملة', color: primaryColor },
        { value: p.totalSurahs, label: 'إجمالي السور', color: midColor },
        { value: `${p.completedWeight.toFixed(1)}/${p.totalWeight}`, label: 'الوزن', color: '#10B981' },
      ];
    }
    // number or multi_book
    const current = p.currentValue;
    const target = p.isPastMid ? p.rangeEnd : p.midYearEnd || p.rangeEnd;
    return [
      { value: current, label: `آخر ${config.unitLabel || 'وحدة'}`, color: primaryColor },
      { value: target, label: `هدف ${p.examLabel}`, color: p.isPastMid ? '#10B981' : midColor },
      { value: p.remaining, label: 'المتبقي', color: '#10B981' },
    ];
  };

  // ── Bar labels ──
  const getBarLabels = () => {
    if (p.progressType === 'surah_ayah') {
      return { startLabel: '', endLabel: `${p.totalWeight} وزن`, examEndLabel: `${p.examTotalWeight} وزن` };
    }
    return {
      startLabel: `${p.rangeStart}`,
      endLabel: `${p.rangeEnd}`,
      examEndLabel: `${p.progressType === 'multi_book' ? p.rangeEnd : (p.isPastMid ? p.rangeEnd : p.midYearEnd)}`,
    };
  };

  // ── Surah-specific ──
  const surahDetails = config.surahDetails || {};
  const activeSurah = p.activeSurah;
  const maxAyah = p.maxAyah || 0;

  // ── Save handler (unified) ──
  const handleSave = async () => {
    if (p.progressType === 'surah_ayah') {
      return handleSurahSave();
    }
    return handleNumberSave();
  };

  const handleNumberSave = async () => {
    const num = parseInt(inputValue, 10);
    const rangeStart = p.rangeStart;
    const rangeEnd = p.rangeEnd;

    if (!num || num < rangeStart || num > rangeEnd) {
      alert(`الرجاء إدخال رقم بين ${rangeStart} و ${rangeEnd}`);
      return;
    }

    setSaving(true);
    try {
      const savePath = getProgressSavePath(config);
      if (p.progressType === 'multi_book') {
        await writeUserData(savePath, { bookIndex: selectedBookIdx, currentValue: num });
      } else {
        await writeUserData(savePath, num);
      }
      clearQadrCache(); // Clear cache so it fetches fresh data next time
      setSaving(false);
      onClose(true);
    } catch (e) {
      console.error('Error saving progress:', e);
      setSaving(false);
    }
  };

  const handleSurahSave = async () => {
    if (!activeSurah) {
      alert('تم الانتهاء من جميع السور!');
      return;
    }
    const ayahNum = parseInt(ayahInput, 10) || 0;
    if (ayahNum < 0 || ayahNum > maxAyah) {
      alert(`الرجاء إدخال رقم آية بين 0 و ${maxAyah}`);
      return;
    }

    setSaving(true);
    try {
      const allSurahs = p.allSurahs;
      const selectedOrder = surahDetails[activeSurah]?.order || 0;
      const completedSurahs = allSurahs.filter(s => (surahDetails[s]?.order || 0) < selectedOrder);

      if (ayahNum >= maxAyah) completedSurahs.push(activeSurah);

      const progressUpdate = {
        completedSurahs,
        currentSurah: ayahNum >= maxAyah ? null : activeSurah,
        currentAyah: ayahNum >= maxAyah ? 0 : ayahNum,
      };

      const savePath = getProgressSavePath(config);
      await writeUserData(savePath, progressUpdate);
      clearQadrCache(); // Clear cache so it fetches fresh data next time
      setSaving(false);
      onClose(true);
    } catch (e) {
      console.error('Error saving surah progress:', e);
      setSaving(false);
    }
  };

  const handleSkip = () => onClose(false);

  const stats = getStats();
  const barLabels = getBarLabels();

  // ── Header subtitle ──
  const getHeaderSubtitle = () => {
    if (p.progressType === 'multi_book') {
      const book = config.books[selectedBookIdx];
      return `${book?.name || ''}`;
    }
    if (p.progressType === 'surah_ayah') {
      return `المقرر: ${p.totalSurahs} سور`;
    }
    return `المقرر: ${p.rangeStart} → ${p.rangeEnd} ${config.unitLabel || ''}`;
  };

  // ── Book name for header ──
  const getBookName = () => {
    if (p.progressType === 'multi_book') {
      return config.books[selectedBookIdx]?.name || '';
    }
    return config.book || '';
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
            {/* ── Header ── */}
            <View style={{ backgroundColor: primaryColor, padding: 24, paddingBottom: 28, alignItems: 'center' }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <MaterialCommunityIcons name="book-open-page-variant" size={26} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                {getBookName()}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                {getHeaderSubtitle()}
              </Text>
            </View>

            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* ── Multi-book selector ── */}
              {p.progressType === 'multi_book' && config.books && (
                <Animated.View entering={FadeIn.delay(100).duration(400)} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {config.books.map((book, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedBookIdx(idx)}
                        style={{
                          flex: 1, padding: 12, borderRadius: 16, alignItems: 'center',
                          backgroundColor: idx === selectedBookIdx ? primaryColor + '15' : cardBg,
                          borderWidth: 2,
                          borderColor: idx === selectedBookIdx ? primaryColor : 'transparent',
                        }}
                      >
                        <Text style={{
                          color: idx === selectedBookIdx ? primaryColor : textSub,
                          fontSize: 11, fontWeight: '700', textAlign: 'center',
                        }} numberOfLines={2}>
                          {book.name}
                        </Text>
                        <Text style={{
                          color: idx === selectedBookIdx ? primaryColor : textSub,
                          fontSize: 9, marginTop: 2, fontWeight: '600',
                        }}>
                          {book.examPeriod === 'midYear' ? 'النصفي' : 'النهائي'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* ── Stats Row ── */}
              <Animated.View entering={FadeIn.delay(200).duration(400)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  {stats.map((stat, i) => (
                    <View key={i} style={{
                      flex: 1, backgroundColor: cardBg, borderRadius: 16, padding: 12,
                      marginHorizontal: i === 1 ? 3 : 0,
                      marginLeft: i === 2 ? 6 : 0,
                      marginRight: i === 0 ? 6 : 0,
                      alignItems: 'center',
                    }}>
                      <Text style={{ color: stat.color, fontSize: 16, fontWeight: 'bold' }} numberOfLines={1} adjustsFontSizeToFit>
                        {stat.value}
                      </Text>
                      <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* ── Progress Bar: Whole Year ── */}
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ color: textMain, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
                    📊 التقدم السنوي  •  {p.wholeYearPercentage.toFixed(1)}%
                  </Text>
                  <AnimatedProgressBar
                    percentage={p.wholeYearPercentage}
                    midPercentage={p.midPercentage}
                    startLabel={barLabels.startLabel}
                    endLabel={barLabels.endLabel}
                    barColor={primaryColor}
                    midColor={midColor}
                    showMidMarker={true}
                    isDark={isDark}
                    delay={300}
                  />
                </View>

                {/* ── Progress Bar: Current Exam ── */}
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: textMain, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
                    📝 الامتحان {p.examLabel}  •  {p.examPercentage.toFixed(1)}%
                  </Text>
                  <AnimatedProgressBar
                    percentage={p.examPercentage}
                    midPercentage={0}
                    startLabel=""
                    endLabel={barLabels.examEndLabel}
                    barColor={examColor}
                    showMidMarker={false}
                    isDark={isDark}
                    delay={600}
                  />
                </View>
              </Animated.View>

              {/* ── Input Section ── */}
              <Animated.View entering={FadeIn.delay(400).duration(400)} style={{ marginTop: 20 }}>
                {p.progressType === 'surah_ayah' ? (
                  // ── Surah/Ayah input ──
                  activeSurah ? (
                    <>
                      <Text style={{ color: midColor, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' }}>
                        السورة الحالية (ترتيب: {surahDetails[activeSurah]?.order})
                      </Text>
                      <View style={{
                        backgroundColor: primaryColor + '15', borderRadius: 16, padding: 16,
                        borderWidth: 2, borderColor: primaryColor, marginBottom: 16,
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
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                      <Ionicons name="trophy" size={48} color="#10B981" style={{ marginBottom: 10 }} />
                      <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 'bold' }}>تم ختم جميع السور المقررة!</Text>
                    </View>
                  )
                ) : (
                  // ── Number input (hadees / page / verse / multi-book) ──
                  <>
                    <Text style={{ color: textMain, fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'right' }}>
                      آخر {config.unitLabel || 'رقم'} درّسته اليوم؟
                    </Text>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg,
                      borderRadius: 16, borderWidth: 2, borderColor: inputBorder,
                      paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
                    }}>
                      <Ionicons
                        name={config.unitLabel === 'صفحة' ? 'document-text-outline' : 'bookmark-outline'}
                        size={18} color={primaryColor} style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={`أدخل رقم ال${config.unitLabel || 'وحدة'} (${p.rangeStart} - ${p.rangeEnd})`}
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        style={{ flex: 1, fontSize: 16, fontWeight: '600', color: textMain, textAlign: 'right' }}
                      />
                    </View>
                  </>
                )}
              </Animated.View>

              {/* ── Buttons ── */}
              <Animated.View entering={FadeIn.delay(500).duration(400)} style={{ marginTop: 20 }}>
                {(p.progressType !== 'surah_ayah' || activeSurah) && (
                  <TouchableOpacity
                    onPress={handleSave}
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
                  <Text style={{ color: textSub, fontSize: 14, fontWeight: '600' }}>
                    {(p.progressType === 'surah_ayah' && !activeSurah) ? 'إغلاق' : 'تخطي'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default QadrProgressModal;
