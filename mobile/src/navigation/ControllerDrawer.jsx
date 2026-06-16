// Drawer navigator pour le contrôleur connecté
// Remplace les tabs acheteur par un menu hamburger avec Scanner + Historique
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DrawerContent from '../components/DrawerContent'
import ControleurDashboardScreen from '../screens/controleur/ControleurDashboardScreen'
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()
const screenOptions = { headerShown: false, animation: 'slide_from_right' }

const DRAWER_ITEMS = [
  { label: 'Accueil', icon: 'home', route: 'Accueil' },
  { label: 'Scanner', icon: 'camera', route: 'Scanner' },
  { label: 'Historique', icon: 'clock', route: 'Historique' },
  { label: 'Déconnexion', icon: 'log-out', route: 'Deconnexion', danger: true },
]

function SimpleStack(Component) {
  return function StackWrapper() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={Component} />
      </Stack.Navigator>
    )
  }
}

export default function ControllerDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent items={DRAWER_ITEMS} {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Accueil" component={SimpleStack(ControleurDashboardScreen)} />
      <Drawer.Screen name="Scanner" component={SimpleStack(ScannerScreen)} />
      <Drawer.Screen name="Historique" component={SimpleStack(ScanHistoryScreen)} />
    </Drawer.Navigator>
  )
}
