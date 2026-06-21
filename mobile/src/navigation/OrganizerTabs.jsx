// Navigation par onglets bas pour l'organisateur connecté
// 4 tabs (Accueil, Événements, Demandes, Profil) avec stacks imbriquées
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

const headerStyle = (colors) => ({
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.accent,
  headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
})

import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SupportScreen from '../screens/SupportScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'
import ChangerMotDePasseScreen from '../screens/organisateur/ChangerMotDePasseScreen'

const Tab = createBottomTabNavigator()
const AccueilStack = createNativeStackNavigator()
const EvenementsStack = createNativeStackNavigator()
const DemandesStack = createNativeStackNavigator()
const ProfilStack = createNativeStackNavigator()

function AccueilNavigator() {
  const { colors } = useTheme()
  const h = headerStyle(colors)
  return (
    <AccueilStack.Navigator screenOptions={{ headerShown: false }}>
      <AccueilStack.Screen name="Dashboard" component={OrganisateurDashboardScreen} />
      <AccueilStack.Screen name="DetailEvenement" component={DetailEvenementScreen} options={{ ...h, headerShown: true, title: 'Détails', headerBackTitle: 'Retour' }} />
    </AccueilStack.Navigator>
  )
}

function EvenementsNavigator() {
  const { colors } = useTheme()
  const h = headerStyle(colors)
  return (
    <EvenementsStack.Navigator screenOptions={{ headerShown: false }}>
      <EvenementsStack.Screen name="EvenementsList" component={GestionEvenementsScreen} />
      <EvenementsStack.Screen name="DetailEvenement" component={DetailEvenementScreen} options={{ ...h, headerShown: true, title: 'Détails', headerBackTitle: 'Retour' }} />
      <EvenementsStack.Screen name="VoirTickets" component={VoirTicketsScreen} options={{ ...h, headerShown: true, title: 'Billets', headerBackTitle: 'Retour' }} />
      <EvenementsStack.Screen name="Statistiques" component={StatistiquesScreen} options={{ ...h, headerShown: true, title: 'Statistiques', headerBackTitle: 'Retour' }} />
    </EvenementsStack.Navigator>
  )
}

function DemandesNavigator() {
  return (
    <DemandesStack.Navigator screenOptions={{ headerShown: false }}>
      <DemandesStack.Screen name="DemandesList" component={MesDemandesScreen} />
    </DemandesStack.Navigator>
  )
}

function ProfilNavigator() {
  const { colors } = useTheme()
  const h = headerStyle(colors)
  return (
    <ProfilStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfilStack.Screen name="ProfilSettings" component={ParametresScreen} />
      <ProfilStack.Screen name="DetailEvenement" component={DetailEvenementScreen} options={{ ...h, headerShown: true, title: 'Détails', headerBackTitle: 'Retour' }} />
      <ProfilStack.Screen name="Notifications" component={NotificationsScreen} options={{ ...h, headerShown: true, title: 'Notifications', headerBackTitle: 'Retour' }} />
      <ProfilStack.Screen name="Support" component={SupportScreen} options={{ ...h, headerShown: true, title: 'Support', headerBackTitle: 'Retour' }} />
      <ProfilStack.Screen name="ChangerMotDePasse" component={ChangerMotDePasseScreen} options={{ headerShown: false }} />
    </ProfilStack.Navigator>
  )
}

export default function OrganizerTabs() {
  const { colors } = useTheme()
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
          name="Accueil"
          component={AccueilNavigator}
          options={{
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Evenements"
          component={EvenementsNavigator}
          options={{
            tabBarLabel: 'Événements',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-month" size={21} color={color} />,
          }}
        />
        <Tab.Screen
          name="Demandes"
          component={DemandesNavigator}
          options={{
            tabBarLabel: 'Demandes',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document-outline" size={21} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfilNavigator}
          options={{
            tabBarLabel: 'Profil',
            tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
          }}
        />
      </Tab.Navigator>
    </TabBarScrollProvider>
  )
}
