import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import EntrerNumeroScreen from '../screens/auth/EntrerNumeroScreen'
import EntrerOTPScreen from '../screens/auth/EntrerOTPScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import ControleurDashboardScreen from '../screens/ControleurDashboardScreen'

const Stack = createNativeStackNavigator()

// Navigation principale : affiche différentes piles selon l'état de connexion
// - non connecté : écrans d'authentification (numéro → OTP) + accès contrôleur
// - connecté acheteur : liste des événements, détail d'un événement
// - connecté contrôleur : dashboard contrôleur
export default function AppNavigator() {
  const { role, chargement } = useAuth()

  // Écran de chargement pendant la restauration de la session AsyncStorage
  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!role && (
          // Pile non-authentifié : inscription/connexion
          <>
            <Stack.Screen name="EntrerNumero" component={EntrerNumeroScreen} />
            <Stack.Screen name="EntrerOTP" component={EntrerOTPScreen} />
            <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} />
          </>
        )}

        {role === 'acheteur' && (
          // Pile acheteur : navigation vers les événements
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="EventSearch" component={EventSearchScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
          </>
        )}

        {role === 'controleur' && (
          // Pile contrôleur : dashboard de scan
          <Stack.Screen name="ControleurDashboard" component={ControleurDashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
})
