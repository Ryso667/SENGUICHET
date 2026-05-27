// Navigation principale de l'application
// 3 piles distinctes selon le rôle : acheteur / controleur / organisateur
// Les écrans non-connectés (auth) sont affichés quand aucun rôle n'est actif
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'

// Écrans auth (aucun rôle)
import AccueilChoixScreen from '../screens/AccueilChoixScreen'
import EntrerNumeroScreen from '../screens/auth/EntrerNumeroScreen'
import EntrerOTPScreen from '../screens/auth/EntrerOTPScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import ConnexionOrganisateurScreen from '../screens/auth/ConnexionOrganisateurScreen'

// Écrans acheteur
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import SupportScreen from '../screens/SupportScreen'

// Écrans contrôleur
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'

// Écrans organisateur
import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import CreerEvenementScreen from '../screens/organisateur/CreerEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'

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
            <Text style={{ fontSize: 14, color: '#ef4444', fontFamily: 'Outfit_600SemiBold' }}>
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
        tabBarActiveTintColor: '#6366F1',
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
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📷</Text>,
          title: 'Scanner',
        }}
      />
      <Tab.Screen
        name="Historique"
        component={ScanHistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
          title: 'Historique',
        }}
      />
    </Tab.Navigator>
  )
}

// Onglets de l'organisateur : Dashboard + Créer + Tickets
function OrganisateurTabs() {
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
            <Text style={{ fontSize: 14, color: '#ef4444', fontFamily: 'Outfit_600SemiBold' }}>
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
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontFamily: 'Outfit_600SemiBold',
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OrganisateurDashboardScreen}
        options={{
          tabBarLabel: 'Tableau de bord',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          title: 'Tableau de bord',
        }}
      />
      <Tab.Screen
        name="CreerEvenement"
        component={CreerEvenementScreen}
        options={{
          tabBarLabel: 'Créer',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>➕</Text>,
          title: 'Nouvel événement',
        }}
      />
      <Tab.Screen
        name="VoirTickets"
        component={VoirTicketsScreen}
        initialParams={{ eventId: null }}
        options={{
          tabBarLabel: 'Tickets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎫</Text>,
          title: 'Tickets',
        }}
      />
      <Tab.Screen
        name="GestionEvenements"
        component={GestionEvenementsScreen}
        options={{
          tabBarLabel: 'Gérer',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
          title: 'Gestion',
        }}
      />
    </Tab.Navigator>
  )
}

// Point d'entrée de la navigation
// Affiche les piles en fonction du rôle stocké dans AuthContext
export default function AppNavigator() {
  const { role, chargement } = useAuth()

  // Écran de chargement pendant la restauration de session
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

        {/* Pas de session active → écran d'accueil + formulaires auth */}
        {!role && (
          <>
            <Stack.Screen name="AccueilChoix" component={AccueilChoixScreen} />
            <Stack.Screen name="EntrerNumero" component={EntrerNumeroScreen} />
            <Stack.Screen name="EntrerOTP" component={EntrerOTPScreen} />
            <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} />
            <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} />
          </>
        )}

        {/* Acheteur connecté : écrans stack (pas de tabs) */}
        {role === 'acheteur' && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="EventSearch" component={EventSearchScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
            <Stack.Screen name="MesTickets" component={MesTicketsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        )}

        {/* Contrôleur connecté : onglets Scanner + Historique */}
        {role === 'controleur' && (
          <Stack.Screen name="ControleurTabs" component={ControleurTabs} />
        )}

        {/* Organisateur connecté : onglets Dashboard + Créer + Tickets */}
        {role === 'organisateur' && (
          <Stack.Screen name="OrganisateurTabs" component={OrganisateurTabs} />
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
