import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logPractice } from '../services/api';

// Timed types — each gets an hours dropdown AND a required details text box.
// Order: Private Lesson, Group Lesson, Fitness Training, Tournament, Hitting, Other.
const TIMED_TYPES = [
  { label: 'Private Lesson',   value: 'Private Lesson',   placeholder: 'Coach and/or location' },
  { label: 'Group Lesson',     value: 'Group Lesson',     placeholder: 'Coach and/or location' },
  { label: 'Fitness Training', value: 'Fitness Training', placeholder: 'Coach and/or location' },
  { label: 'Tournament',       value: 'Tournament',       placeholder: 'Level and location' },
  { label: 'Hitting',          value: 'Hitting',          placeholder: 'Partner and/or location' },
  { label: 'Other',            value: 'Other',            placeholder: 'Other details' },
];

// Checkbox-only types — no hours input, no details box.
// School Practice counts as 2 fixed hrs; rest are 0 hrs (informational).
const CHECKBOX_TYPES = [
  { label: 'School Practice', value: 'School Practice', fixedHours: 2 },
  { label: 'Out of Town',     value: 'Out of Town',     fixedHours: 0 },
  { label: 'Sick',            value: 'Sick',            fixedHours: 0 },
  { label: 'Bad Weather',     value: 'Bad Weather',     fixedHours: 0 },
  { label: 'Rest Day',        value: 'Rest Day',        fixedHours: 0 },
];

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => parseFloat((i * 0.5).toFixed(1)));

function fmtHrs(h) {
  if (h === 0) return '0 hrs';
  if (h === 1) return '1 hr';
  return `${h} hrs`;
}

function todayString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const initHours   = () => Object.fromEntries(TIMED_TYPES.map(t => [t.value, 0]));
const initDetails = () => Object.fromEntries(TIMED_TYPES.map(t => [t.value, '']));
const initChecked = () => Object.fromEntries(CHECKBOX_TYPES.map(t => [t.value, false]));

export default function LogPracticeScreen({ navigation, route }) {
  const [user, setUser]               = useState(route.params?.user || null);
  const [date, setDate]               = useState(todayString());
  const [typeHours, setTypeHours]     = useState(initHours());
  const [typeDetails, setTypeDetails] = useState(initDetails());
  const [cbChecked, setCbChecked]     = useState(initChecked());
  const [loading, setLoading]         = useState(false);
  const [activeDropdown, setDropdown] = useState(null);

  useEffect(() => {
    if (!user) {
      AsyncStorage.getItem('loggedInUser').then(stored => {
        if (stored) setUser(JSON.parse(stored));
        else navigation.replace('Login');
      });
    }
  }, []);

  const timedTotal = Object.values(typeHours).reduce((s, h) => s + h, 0);
  const cbHours    = CHECKBOX_TYPES.reduce((s, t) => s + (cbChecked[t.value] ? t.fixedHours : 0), 0);
  const totalHours = timedTotal + cbHours;

  const toggleCb = (val) => setCbChecked(prev => ({ ...prev, [val]: !prev[val] }));

  // Build the cell content for the Google Sheet.
  // Format: "1 hr coach rachel, 3 hrs ata, 2 hrs school practice, Sick"
  // Category names are NOT included — only hours + the member's own description.
  const buildSessionContent = () => {
    const parts = [];
    TIMED_TYPES.forEach(t => {
      const h = typeHours[t.value];
      if (h > 0) {
        const hStr = h === 1 ? '1 hr' : `${h} hrs`;
        parts.push(`${hStr} ${typeDetails[t.value].trim()}`);
      }
    });
    CHECKBOX_TYPES.forEach(t => {
      if (cbChecked[t.value]) {
        if (t.fixedHours > 0) {
          // School Practice: record the hours so Stats/Analysis can count them
          parts.push(`${t.fixedHours} hrs ${t.value.toLowerCase()}`);
        } else {
          // Zero-hr checkboxes: just the label (informational)
          parts.push(t.value);
        }
      }
    });
    return parts.join(', ');
  };

  const doSubmit = async (override = false) => {
    setLoading(true);
    try {
      const result = await logPractice({
        name: user.name,
        date,
        practiceType: buildSessionContent(),
        hours: totalHours,
        override,
      });

      if (result.success) {
        navigation.replace('Congratulations', { user, totalHours, date });
      } else if (result.duplicate) {
        setLoading(false);
        Alert.alert(
          'Log already exists',
          `You already submitted a log for ${date}. What would you like to do?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Override previous log', style: 'destructive',
              onPress: () => doSubmit(true) },
          ]
        );
      } else {
        setLoading(false);
        Alert.alert('Error', result.message || 'Please try again.');
      }
    } catch {
      setLoading(false);
      Alert.alert('Connection error', 'Could not reach the server.');
    }
  };

  const handleSubmit = () => {
    // At least one timed type with hours > 0, OR at least one checkbox checked
    const anyTimed = TIMED_TYPES.some(t => typeHours[t.value] > 0);
    const anyCb    = CHECKBOX_TYPES.some(t => cbChecked[t.value]);
    if (!anyTimed && !anyCb) {
      Alert.alert('Nothing selected', 'Please log at least one practice activity.');
      return;
    }

    // Details box is required for every timed type that has nonzero hours
    for (const t of TIMED_TYPES) {
      if (typeHours[t.value] > 0 && !typeDetails[t.value].trim()) {
        Alert.alert('Details required', `Please add details for ${t.label}.`);
        return;
      }
    }

    doSubmit(false);
  };

  if (!user) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#2E7D32" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hi, <Text style={styles.greetingName}>{user.name}</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Today's Practice</Text>

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#A5A5A5"
          />
          <Text style={styles.hint}>Today: {todayString()} — edit if logging a past session</Text>

          {/* Timed types — each has a dropdown + details text box */}
          <Text style={styles.label}>Practice Hours</Text>
          {TIMED_TYPES.map(pt => {
            const hrs    = typeHours[pt.value];
            const active = hrs > 0;
            const filled = typeDetails[pt.value].trim().length > 0;
            return (
              <View key={pt.value} style={styles.timedGroup}>
                {/* Hour selector row */}
                <View style={[styles.typeRow, active && styles.typeRowActive]}>
                  <Text style={styles.typeLabel}>{pt.label}</Text>
                  <TouchableOpacity
                    style={[styles.dropBtn, active && styles.dropBtnActive]}
                    onPress={() => setDropdown(pt.value)}
                  >
                    <Text style={[styles.dropBtnText, active && styles.dropBtnTextActive]}>
                      {fmtHrs(hrs)} ▾
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Details text box — always visible; required when active */}
                <TextInput
                  style={[
                    styles.detailInput,
                    active && styles.detailInputActive,
                    active && !filled && styles.detailInputRequired,
                  ]}
                  placeholder={
                    active
                      ? pt.placeholder
                      : 'Select hours above to add details'
                  }
                  placeholderTextColor={active ? '#A5A5A5' : '#C8C8C8'}
                  value={typeDetails[pt.value]}
                  onChangeText={v => setTypeDetails(prev => ({ ...prev, [pt.value]: v }))}
                  editable={active}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            );
          })}

          {/* Checkbox types */}
          {CHECKBOX_TYPES.map(t => {
            const checked = cbChecked[t.value];
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeRow, checked && styles.typeRowActive]}
                onPress={() => toggleCb(t.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.typeLabel, { marginLeft: 10, flex: 1 }]}>{t.label}</Text>
                <View style={[styles.dropBtn, checked && styles.dropBtnActive, { opacity: 1 }]}>
                  <Text style={[styles.dropBtnText, checked && styles.dropBtnTextActive]}>
                    {t.fixedHours > 0 ? `${t.fixedHours} hrs` : '0 hrs'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Total hours */}
          {totalHours > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total: {fmtHrs(totalHours)}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Submit Practice Log</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Your log is saved to the team Google Sheet automatically.</Text>
      </ScrollView>

      {/* Hours dropdown modal */}
      <Modal
        visible={activeDropdown !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdown(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdown(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {TIMED_TYPES.find(t => t.value === activeDropdown)?.label}
            </Text>
            <FlatList
              data={HOUR_OPTIONS}
              keyExtractor={item => String(item)}
              renderItem={({ item }) => {
                const sel = typeHours[activeDropdown] === item;
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, sel && styles.modalOptionSel]}
                    onPress={() => {
                      setTypeHours(prev => ({ ...prev, [activeDropdown]: item }));
                      setDropdown(null);
                    }}
                  >
                    <Text style={[styles.modalOptionText, sel && styles.modalOptionTextSel]}>
                      {item === 0 ? '0 hours (none)' : item === 1 ? '1 hour' : `${item} hours`}
                    </Text>
                    {sel && <Text style={styles.modalCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: '#F1F8E9' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flexGrow: 1, padding: 20, paddingTop: 16 },

  greeting:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greetingText: { fontSize: 17, color: '#1B5E20' },
  greetingName: { fontWeight: '700' },
  logoutText:   { fontSize: 14, color: '#C62828', fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 22,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginBottom: 4 },

  label: {
    fontSize: 12, fontWeight: '600', color: '#2E7D32',
    marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  hint:  { fontSize: 12, color: '#888', marginTop: 4 },

  input: {
    borderWidth: 1.5, borderColor: '#C8E6C9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: '#1B1B1B', backgroundColor: '#FAFAFA',
  },

  // Each timed type: dropdown row + details box grouped together
  timedGroup: { marginBottom: 10 },

  typeRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C8E6C9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: '#FAFAFA',
  },
  typeRowActive: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  typeLabel: { fontSize: 15, color: '#333', flex: 1 },

  dropBtn: {
    borderWidth: 1.5, borderColor: '#C8E6C9', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#fff', minWidth: 80, alignItems: 'center',
  },
  dropBtnActive:     { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  dropBtnText:       { fontSize: 14, color: '#888', fontWeight: '600' },
  dropBtnTextActive: { color: '#2E7D32' },

  // Details text box below each timed type
  detailInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderTopWidth: 0,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1B1B1B',
    backgroundColor: '#F7F7F7', minHeight: 44,
  },
  detailInputActive: {
    borderColor: '#A5D6A7', backgroundColor: '#FAFAFA', color: '#1B1B1B',
  },
  detailInputRequired: {
    borderColor: '#EF9A9A', backgroundColor: '#FFF5F5',
  },

  // Checkbox styles
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#A5D6A7', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  checkmark:       { color: '#fff', fontSize: 13, fontWeight: '700' },

  totalRow: { alignItems: 'flex-end', marginTop: 8, marginBottom: 2 },
  totalText: { fontSize: 13, color: '#2E7D32', fontWeight: '700' },

  button: {
    backgroundColor: '#2E7D32', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { textAlign: 'center', marginTop: 20, marginBottom: 8, fontSize: 12, color: '#888' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 16, paddingBottom: 40, maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700', color: '#1B5E20', textAlign: 'center',
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    marginBottom: 4, paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 24,
  },
  modalOptionSel:     { backgroundColor: '#F1F8E9' },
  modalOptionText:    { fontSize: 16, color: '#333' },
  modalOptionTextSel: { color: '#2E7D32', fontWeight: '700' },
  modalCheck:         { color: '#2E7D32', fontSize: 16, fontWeight: '700' },
});
