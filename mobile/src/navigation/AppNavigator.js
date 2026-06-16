// Navigation principale — 4 tabs fixes avec piles contextuelles
// Tous les rôles (acheteur/organisateur/controleur) partagent les mêmes tabs
// Les écrans auth/orga/contrôleur sont dans la stack, accessibles depuis Compte
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

// Écrans tabs
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import ProfilScreen from '../screens/ProfilScreen'

// Écrans stack (auth, organisateur, contrôleur)
import SocialAuthScreen from '../screens/auth/SocialAuthScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import ConnexionOrganisateurScreen from '../screens/auth/ConnexionOrganisateurScreen'
import InscriptionOrganisateurScreen from '../screens/auth/InscriptionOrganisateurScreen'
import EnAttenteValidationScreen from '../screens/auth/EnAttenteValidationScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import SupportScreen from '../screens/SupportScreen'
import WebViewWaveScreen from '../screens/WebViewWaveScreen'
import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'
import ChangerMotDePasseScreen from '../screens/organisateur/ChangerMotDePasseScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <TabBarScrollProvider>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navActive,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.jakarta.semiBold || 'PlusJakartaSans_600SemiBold',
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="EventSearch"
        component={EventSearchScreen}
        options={{
          tabBarLabel: 'Explorer',
          tabBarIcon: ({ color }) => <Feather name="search" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MesTickets"
        component={MesTicketsScreen}
        options={{
          tabBarLabel: 'Mes billets',
          tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Compte',
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
    </TabBarScrollProvider>
  )
}

const navigationRef = createNavigationContainerRef()

export default function AppNavigator() {
  const { role, chargement } = useAuth()

  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  const headerStyle = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
    headerTintColor: colors.accent,
    headerBackTitle: 'Retour',
  }
  const header = (titre) => ({ ...headerStyle, headerTitle: titre })

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}>
        {/* Tabs principaux — toujours visibles */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Écrans auth (empilés depuis Compte) */}
        <Stack.Screen name="SocialAuth" component={SocialAuthScreen} />
        <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} options={header('Connexion')} />
        <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} options={header('Connexion')} />
        <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} options={header('Inscription')} />
        <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />

        {/* Écrans acheteur */}
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Support" component={SupportScreen} options={header('Support')} />

        {/* Écrans organisateur */}
        <Stack.Screen name="OrganisateurDashboard" component={OrganisateurDashboardScreen} />
        <Stack.Screen name="GestionEvenements" component={GestionEvenementsScreen} />
        <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
        <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
        <Stack.Screen name="Statistiques" component={StatistiquesScreen} />
        <Stack.Screen name="MesDemandes" component={MesDemandesScreen} />
        <Stack.Screen name="Parametres" component={ParametresScreen} options={header('Paramètres')} />
        <Stack.Screen name="ChangerMotDePasse" component={ChangerMotDePasseScreen} options={header('Changer le mot de passe')} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={header('Notifications')} />

        {/* Écrans contrôleur */}
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
})
