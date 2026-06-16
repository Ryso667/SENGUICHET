// Navigation principale
// Guest/Acheteur : 4 tabs (Accueil, Explorer, Mes billets, Compte)
// Organisateur   : Drawer hamburger (Dashboard, Événements, ...)
// Contrôleur     : Drawer hamburger (Scanner, Historique, ...)
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import ProfilScreen from '../screens/ProfilScreen'

import SocialAuthScreen from '../screens/auth/SocialAuthScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import ConnexionOrganisateurScreen from '../screens/auth/ConnexionOrganisateurScreen'
import InscriptionOrganisateurScreen from '../screens/auth/InscriptionOrganisateurScreen'
import EnAttenteValidationScreen from '../screens/auth/EnAttenteValidationScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import SupportScreen from '../screens/SupportScreen'
import WebViewWaveScreen from '../screens/WebViewWaveScreen'
import NotificationsScreen from '../screens/NotificationsScreen'

import OrganizerDrawer from './OrganizerDrawer'
import ControllerDrawer from './ControllerDrawer'

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
          tabBarIcon: ({ color }) => <Feather name="ticket" size={20} color={color} />,
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

const headerStyle = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
  headerTintColor: colors.accent,
  headerBackTitle: 'Retour',
}
const header = (titre) => ({ ...headerStyle, headerTitle: titre })

function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      animation: 'slide_from_right',
      animationDuration: 250,
    }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="SocialAuth" component={SocialAuthScreen} />
      <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} options={header('Connexion')} />
      <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} options={header('Connexion')} />
      <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} options={header('Inscription')} />
      <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Ticket" component={TicketScreen} />
      <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={SupportScreen} options={header('Support')} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={header('Notifications')} />
    </Stack.Navigator>
  )
}


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
      {!role && <GuestNavigator />}
      {role === 'organisateur' && <OrganizerDrawer />}
      {role === 'controleur' && <ControllerDrawer />}
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
