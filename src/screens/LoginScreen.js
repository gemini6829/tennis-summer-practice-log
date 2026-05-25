import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your first name.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ name: trimmed });
      if (result.success) {
        await AsyncStorage.setItem('loggedInUser', JSON.stringify(result.user));
        navigation.replace('Home', { user: result.user });
      } else {
        Alert.alert('Not found', result.message || 'Your name was not found. Contact your coach to be added to the log.');
      }
    } catch {
      Alert.alert('Connection error', 'Could not reach the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.appName}>Tennis Tracker</Text>
          <Text style={styles.tagline}>Log your practice. Track your progress.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#A5A5A5"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Log In</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Not on the list? Ask your coach to add your name to the log.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F1F8E9' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1B5E20', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: '#558B2F', marginTop: 6 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12, elevation: 4,
  },
  label: {
    fontSize: 13, fontWeight: '600', color: '#2E7D32',
    marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5, borderColor: '#C8E6C9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: '#1B1B1B', backgroundColor: '#FAFAFA',
  },
  button: {
    backgroundColor: '#2E7D32', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  helpText: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 24 },
});
