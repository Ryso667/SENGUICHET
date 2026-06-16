// Stack navigator pour le contrôleur connecté
// Remplace l'ancien drawer hamburger par une stack stable sans reanimated
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ControleurDashboardScreen from '../screens/controleur/ControleurDashboardScreen'
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'
import { colors, fonts } from '../constants/theme'

const Stack = createNativeStackNavigator()

const header = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.accent,
  headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
}

export default function ControllerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Accueil" component={ControleurDashboardScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ ...header, headerShown: true, title: 'Scanner' }} />
      <Stack.Screen name="Historique" component={ScanHistoryScreen} options={{ ...header, headerShown: true, title: 'Historique' }} />
    </Stack.Navigator>
  )
}
