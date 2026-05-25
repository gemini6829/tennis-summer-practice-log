import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation, route }) {
  const user = route.params?.user;

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('loggedInUser');
        navigation.replace('Login');
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summer Practice Log 2026</Text>
      <Text style={styles.greeting}>Hi, <Text style={styles.name}>{user?.name}</Text>!</Text>
      <Text style={styles.sub}>What would you like to do?</Text>

      <TouchableOpacity
        style={styles.cardBtn}
        onPress={() => navigation.navigate('LogPractice', { user })}
      >
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Log Practice Hours</Text>
          <Text style={styles.cardSub}>Record today's training session</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cardBtn, styles.cardBtnAlt]}
        onPress={() => navigation.navigate('Analysis', { user })}
      >
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>View My Analysis</Text>
          <Text style={styles.cardSub}>See your stats and team ranking</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F1F8E9',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1B5E20', letterSpacing: 0.5, marginBottom: 16 },
  greeting: { fontSize: 18, color: '#2E7D32', marginBottom: 4 },
  name: { fontWeight: '700' },
  sub: { fontSize: 14, color: '#666', marginBottom: 36 },

  cardBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#C8E6C9',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8, elevation: 3,
  },
  cardBtnAlt: { borderColor: '#A5D6A7' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  cardSub: { fontSize: 13, color: '#777', marginTop: 2 },
  chevron: { fontSize: 26, color: '#A5D6A7', fontWeight: '300' },

  logoutBtn: { marginTop: 28 },
  logoutText: { fontSize: 14, color: '#C62828', fontWeight: '600' },
});
