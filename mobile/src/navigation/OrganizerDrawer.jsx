// Stack navigator pour l'organisateur connecté
// Remplace l'ancien drawer hamburger par une stack stable sans reanimated
// Chaque section est une route directe dans la stack (plus de drawer imbriqué)
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors, fonts } from '../constants/theme'

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

const Stack = createNativeStackNavigator()

const header = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.accent,
  headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
}

export default function OrganizerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={OrganisateurDashboardScreen} />
      <Stack.Screen name="Evenements" component={GestionEvenementsScreen} options={{ ...header, headerShown: true, title: 'Mes événements' }} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} options={{ ...header, headerShown: true, title: 'Détails' }} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} options={{ ...header, headerShown: true, title: 'Billets' }} />
      <Stack.Screen name="Statistiques" component={StatistiquesScreen} options={{ ...header, headerShown: true, title: 'Statistiques' }} />
      <Stack.Screen name="Demandes" component={MesDemandesScreen} options={{ ...header, headerShown: true, title: 'Demandes' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ ...header, headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ ...header, headerShown: true, title: 'Support' }} />
      <Stack.Screen name="Parametres" component={ParametresScreen} options={{ ...header, headerShown: true, title: 'Paramètres' }} />
      <Stack.Screen name="ChangerMotDePasse" component={ChangerMotDePasseScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}
