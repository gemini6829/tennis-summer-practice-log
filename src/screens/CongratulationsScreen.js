import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function fmtHrs(h) {
  if (!h || h === 0) return '0 hours';
  if (h === 1) return '1 hour';
  return `${h} hours`;
}

export default function CongratulationsScreen({ navigation, route }) {
  const { user, totalHours, date } = route.params || {};

  const formatted = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Congratulations!</Text>
      <Text style={styles.sub}>Great work — every hour on the court counts!</Text>

      <View style={styles.card}>
        <Text style={styles.dateLabel}>{formatted}</Text>
        {totalHours > 0 ? (
          <>
            <Text style={styles.hoursNum}>{fmtHrs(totalHours)}</Text>
            <Text style={styles.hoursCaption}>logged today</Text>
          </>
        ) : (
          <Text style={styles.hoursCaption}>Session logged</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Home', { user })}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.replace('LogPractice', { user })}
      >
        <Text style={styles.secondaryText}>Log another session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F1F8E9',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  heading: { fontSize: 30, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  sub: {
    fontSize: 15, color: '#558B2F', textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 32, paddingHorizontal: 28,
    alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12, elevation: 4, marginBottom: 32,
  },
  dateLabel: { fontSize: 14, color: '#888', marginBottom: 12 },
  hoursNum: { fontSize: 40, fontWeight: '800', color: '#1B5E20', marginBottom: 4 },
  hoursCaption: { fontSize: 16, color: '#558B2F', fontWeight: '500' },

  button: {
    width: '100%', backgroundColor: '#2E7D32', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  secondaryBtn: { paddingVertical: 10 },
  secondaryText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },
});
