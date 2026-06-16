// Drawer navigator pour l'organisateur connecté
// Remplace les tabs acheteur par un menu hamburger
// Chaque item a son propre NativeStackNavigator
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useState, useEffect, useCallback } from 'react'
import { fetchCompteurNonLues } from '../services/notificationService'
import { useFocusEffect } from '@react-navigation/native'
import DrawerContent from '../components/DrawerContent'

import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SupportScreen from '../screens/SupportScreen'

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()
const screenOptions = { headerShown: false, animation: 'slide_from_right' }

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DashboardHome" component={OrganisateurDashboardScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

function EvenementsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="EvenementsList" component={GestionEvenementsScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

function SimpleStack(Component) {
  return function StackWrapper() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={Component} />
      </Stack.Navigator>
    )
  }
}

export default function OrganizerDrawer() {
  const [nbNonLues, setNbNonLues] = useState(0)

  useFocusEffect(useCallback(() => {
    let actif = true
    const charger = async () => {
      try {
        const total = await fetchCompteurNonLues()
        if (actif) setNbNonLues(total)
      } catch {}
    }
    charger()
    const interval = setInterval(charger, 30000)
    return () => { actif = false; clearInterval(interval) }
  }, []))

  const items = [
    { label: 'Dashboard', icon: 'layout', route: 'Dashboard' },
    { label: 'Événements', icon: 'calendar', route: 'Evenements' },
    { label: 'Statistiques', icon: 'bar-chart-2', route: 'Statistiques' },
    { label: 'Demandes', icon: 'file-text', route: 'Demandes' },
    { label: 'Notifications', icon: 'bell', route: 'Notifications', badge: nbNonLues },
    { label: 'Support', icon: 'headphones', route: 'Support' },
    { label: 'Déconnexion', icon: 'log-out', route: 'Deconnexion', danger: true },
  ]

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent items={items} {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardStack} />
      <Drawer.Screen name="Evenements" component={EvenementsStack} />
      <Drawer.Screen name="Statistiques" component={SimpleStack(StatistiquesScreen)} />
      <Drawer.Screen name="Demandes" component={SimpleStack(MesDemandesScreen)} />
      <Drawer.Screen name="Notifications" component={SimpleStack(NotificationsScreen)} />
      <Drawer.Screen name="Support" component={SimpleStack(SupportScreen)} />
    </Drawer.Navigator>
  )
}
