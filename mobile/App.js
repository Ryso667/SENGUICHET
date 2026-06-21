// Point d'entrée principal de l'application SENGUICHET
// Charge les polices, initialise SplashScreen, configure les notifications push
// et rend le AuthProvider + AppNavigator
import { useCallback, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from './src/context/AuthContext'
import { ToastProvider } from './src/context/ToastContext'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import AppNavigator from './src/navigation/AppNavigator'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { configurerNotifications, obtenirTokenPush, enregistrerToken, fetchCompteurNonLues, ajouterListenerNotification } from './src/services/notificationService'
import { useAuth } from './src/context/AuthContext'

SplashScreen.preventAutoHideAsync()

// Composant racine : charge les polices Google Fonts puis rend l'arbre ThemeProvider → ToastProvider → AuthProvider → AppNavigator
function AppContent() {
  const { colors, isDark } = useTheme()
  const { role } = useAuth()
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

  // Configure les notifications push, enregistre le token, initialise le badge
  useEffect(() => {
    async function setupNotifications() {
      try {
        await configurerNotifications()

        // Les push Expo ne fonctionnent pas sur émulateur
        if (!Device.isDevice) return

        const token = await obtenirTokenPush()
        if (token) {
          await enregistrerToken(token, role || 'organisateur')
        }

        // Récupère le compteur de notifications non lues au lancement
        const count = await fetchCompteurNonLues()
        await Notifications.setBadgeCountAsync(count)
      } catch {
        // Silencieux — les notifications ne sont pas bloquantes
      }
    }

    setupNotifications()

    // Met à jour le badge à chaque notification reçue
    const subscription = ajouterListenerNotification(async () => {
      try {
        const count = await fetchCompteurNonLues()
        await Notifications.setBadgeCountAsync(count)
      } catch {
        // Silencieux
      }
    })

    return () => subscription.remove()
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  const styles = makeStyles(colors)

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={styles.root} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <ToastProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
