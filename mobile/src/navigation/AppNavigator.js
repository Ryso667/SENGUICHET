// Navigation principale de l'application
// 3 piles distinctes selon le rôle : acheteur / controleur / organisateur
// Les écrans non-connectés (auth) sont affichés quand aucun rôle n'est actif
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'

// Écrans auth (aucun rôle)
import AccueilChoixScreen from '../screens/AccueilChoixScreen'
import SocialAuthScreen from '../screens/auth/SocialAuthScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import ConnexionOrganisateurScreen from '../screens/auth/ConnexionOrganisateurScreen'
import InscriptionOrganisateurScreen from '../screens/auth/InscriptionOrganisateurScreen'
import EnAttenteValidationScreen from '../screens/auth/EnAttenteValidationScreen'

// Écrans acheteur
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import SupportScreen from '../screens/SupportScreen'
import WebViewWaveScreen from '../screens/WebViewWaveScreen'

// Écrans contrôleur
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'

// Écrans organisateur (tabs)
import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import CreerEvenementScreen from '../screens/organisateur/CreerEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
// Écrans organisateur (stack — poussés au-dessus des tabs)
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Onglets du contrôleur : Scanner + Historique
function ControleurTabs() {
  const { deconnecter } = useAuth()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' },
        // Bouton Quitter (déconnexion) dans le header de chaque tab
        headerRight: () => (
          <TouchableOpacity onPress={deconnecter} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 14, color: '#FF4D6D', fontFamily: 'Outfit_600SemiBold' }}>
              Quitter
            </Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#edf0f5',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#00C8FF',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontFamily: 'Outfit_600SemiBold',
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scanner',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="qrcode-scan" size={22} color={color} />,
          title: 'Scanner',
        }}
      />
      <Tab.Screen
        name="Historique"
        component={ScanHistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={color} />,
          title: 'Historique',
        }}
      />
    </Tab.Navigator>
  )
}

// Point d'entrée de la navigation
export default function AppNavigator() {
  const { role, chargement } = useAuth()

  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color="#00C8FF" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>

        {/* Pas de session active → écran d'accueil + formulaires auth */}
        {!role && (
          <>
            <Stack.Screen name="AccueilChoix" component={AccueilChoixScreen} />
            <Stack.Screen name="SocialAuth" component={SocialAuthScreen} />
            <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} />
            <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} />
            <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} />
            <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />
          </>
        )}

        {/* Acheteur connecté */}
        {role === 'acheteur' && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="EventSearch" component={EventSearchScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
            <Stack.Screen name="MesTickets" component={MesTicketsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
          </>)}

        {/* Contrôleur connecté */}
        {role === 'controleur' && (
          <Stack.Screen name="ControleurTabs" component={ControleurTabs} />
        )}

        {/* Organisateur connecté */}
        {role === 'organisateur' && (
          <>
            <Stack.Screen name="Dashboard" component={OrganisateurDashboardScreen} />
            <Stack.Screen
              name="CreerEvenement"
              component={CreerEvenementScreen}
              options={{ headerShown: true, headerTitle: 'Nouvel événement', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#FFFFFF' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' }, headerTintColor: '#00C8FF' }}
            />
            <Stack.Screen
              name="VoirTickets"
              component={VoirTicketsScreen}
              initialParams={{ eventId: null }}
              options={{ headerShown: true, headerTitle: 'Tickets', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#FFFFFF' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' }, headerTintColor: '#00C8FF' }}
            />
            <Stack.Screen
              name="GestionEvenements"
              component={GestionEvenementsScreen}
              options={{ headerShown: true, headerTitle: 'Gestion', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#FFFFFF' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' }, headerTintColor: '#00C8FF' }}
            />
            <Stack.Screen
              name="DetailEvenement"
              component={DetailEvenementScreen}
              options={{ headerShown: true, headerTitle: 'Détail', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#FFFFFF' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' }, headerTintColor: '#00C8FF' }}
            />
            <Stack.Screen
              name="Statistiques"
              component={StatistiquesScreen}
              options={{ headerShown: true, headerTitle: 'Statistiques', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#FFFFFF' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' }, headerTintColor: '#00C8FF' }}
            />
            <Stack.Screen
              name="Parametres"
              component={ParametresScreen}
              options={{ headerShown: true, headerTitle: 'Paramètres', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#FFFFFF' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' }, headerTintColor: '#00C8FF' }}
            />
          </>
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
