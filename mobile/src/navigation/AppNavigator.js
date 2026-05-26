import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'
import EntrerNumeroScreen from '../screens/auth/EntrerNumeroScreen'
import EntrerOTPScreen from '../screens/auth/EntrerOTPScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function ControleurTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
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
        }}
      />
      <Tab.Screen
        name="Historique"
        component={ScanHistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { role, chargement } = useAuth()

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
          <>
            <Stack.Screen name="EntrerNumero" component={EntrerNumeroScreen} />
            <Stack.Screen name="EntrerOTP" component={EntrerOTPScreen} />
            <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} />
          </>
        )}

        {role === 'acheteur' && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="EventSearch" component={EventSearchScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
          </>
        )}

        {role === 'controleur' && (
          <Stack.Screen name="ControleurTabs" component={ControleurTabs} />
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
