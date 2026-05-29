// Point d'entrée principal de l'application SENGUICHET
// Charge les polices, initialise SplashScreen et rend le AuthProvider + AppNavigator
import { useCallback } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from './src/context/AuthContext'
import { ToastProvider } from './src/context/ToastContext'
import AppNavigator from './src/navigation/AppNavigator'

SplashScreen.preventAutoHideAsync()

// Composant racine : charge les polices Google Fonts puis rend l'arbre ToastProvider → AuthProvider → AppNavigator
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root} onLayout={onLayoutRootView}>
        <ToastProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ToastProvider>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FD',
  },
})
