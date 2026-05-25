import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LoginScreen         from './src/screens/LoginScreen';
import HomeScreen          from './src/screens/HomeScreen';
import LogPracticeScreen   from './src/screens/LogPracticeScreen';
import CongratulationsScreen from './src/screens/CongratulationsScreen';
import AnalysisScreen      from './src/screens/AnalysisScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialParams, setInitialParams] = useState(undefined);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('loggedInUser');
        if (stored) {
          setInitialParams({ user: JSON.parse(stored) });
          setInitialRoute('Home');
        } else {
          setInitialRoute('Login');
        }
      } catch {
        setInitialRoute('Login');
      }
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: '#2E7D32' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Tennis Tracker', headerLeft: null }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            initialParams={initialParams}
            options={{ title: 'Summer Practice Log 2026', headerLeft: null }}
          />
          <Stack.Screen
            name="LogPractice"
            component={LogPracticeScreen}
            options={{ title: 'Log Practice' }}
          />
          <Stack.Screen
            name="Congratulations"
            component={CongratulationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Analysis"
            component={AnalysisScreen}
            options={{ title: 'My Analysis' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#F1F8E9',
  },
});
