// Navigation principale de l'application
// 3 piles distinctes selon le rôle : acheteur / controleur / organisateur
// Les écrans non-connectés (auth) sont affichés quand aucun rôle n'est actif
import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
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
import InscriptionOrganisateurScreen from '../screens/auth/InscriptionOrganisateurScreen'
import EnAttenteValidationScreen from '../screens/auth/EnAttenteValidationScreen'

// Écrans acheteur
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import PaiementScreen from '../screens/PaiementScreen'
import SupportScreen from '../screens/SupportScreen'

// Écrans contrôleur
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'

// Écrans organisateur
import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Header réutilisable pour les tabs organisateur
function OrganisateurHeader({ title, deconnecter, badgeCount }) {
  return (
    <View style={headerStyles.container}>
      <TouchableOpacity onPress={deconnecter} style={headerStyles.left}>
        <Feather name="log-out" size={20} color="#FF4D6D" />
      </TouchableOpacity>
      <Text style={headerStyles.title}>{title}</Text>
      <View style={headerStyles.right}>
        <View style={headerStyles.logoPlaceholder}>
          <Text style={headerStyles.logoText}>S</Text>
        </View>
      </View>
    </View>
  )
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,200,255,0.15)',
  },
  left: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,77,109,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  right: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,200,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {},
  logoText: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#00C8FF',
  },
})

// Onglets organisateur : 4 tabs
function OrganisateurTabs() {
  const { deconnecter } = useAuth()
  const [demandesCount] = React.useState(2)

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => null,
        tabBarStyle: {
          backgroundColor: '#0D1B2A',
          borderTopColor: 'rgba(0,200,255,0.15)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#00C8FF',
        tabBarInactiveTintColor: '#A0B4C8',
        tabBarLabelStyle: {
          fontFamily: 'Outfit_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={OrganisateurDashboardScreen}
        options={{
          tabBarLabel: 'Tableau de bord',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MesEvenementsTab"
        component={GestionEvenementsScreen}
        options={{
          tabBarLabel: 'Mes événements',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="StatistiquesTab"
        component={StatistiquesScreen}
        options={{
          tabBarLabel: 'Statistiques',
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MesDemandesTab"
        component={MesDemandesScreen}
        options={{
          tabBarLabel: 'Mes demandes',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Feather name="bell" size={20} color={color} />
              {demandesCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#FF4D6D',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Outfit_700Bold' }}>
                    {demandesCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

// Wrapper avec header personnalisé par dessus les tabs
function OrganisateurLayout() {
  const { deconnecter } = useAuth()
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1B2A' }}>
      <OrganisateurHeader title="SENGUICHET" deconnecter={deconnecter} />
      <OrganisateurTabs />
    </View>
  )
}

// Onglets du contrôleur : Scanner + Historique
function ControleurTabs() {
  const { deconnecter } = useAuth()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#0f172a' },
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
          tabBarIcon: ({ color }) => <Feather name="maximize" size={20} color={color} />,
          title: 'Scanner',
        }}
      />
      <Tab.Screen
        name="Historique"
        component={ScanHistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => <Feather name="clock" size={20} color={color} />,
          title: 'Historique',
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
            <Stack.Screen name="EntrerNumero" component={EntrerNumeroScreen} />
            <Stack.Screen name="EntrerOTP" component={EntrerOTPScreen} />
            <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} />
            <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} />
            <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} />
            <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />
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
            <Stack.Screen name="Paiement" component={PaiementScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        )}

        {/* Contrôleur connecté : onglets Scanner + Historique */}
        {role === 'controleur' && (
          <Stack.Screen name="ControleurTabs" component={ControleurTabs} />
        )}

        {/* Organisateur connecté : bottom tabs + stack screens */}
        {role === 'organisateur' && (
          <>
            <Stack.Screen name="OrganisateurTabs" component={OrganisateurLayout} />
            <Stack.Screen
              name="DetailEvenement"
              component={DetailEvenementScreen}
              options={{ headerShown: true, headerTitle: 'Détail', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#0D1B2A' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#FFFFFF' }, headerTintColor: '#00C8FF' }}
            />
            <Stack.Screen
              name="Parametres"
              component={ParametresScreen}
              options={{ headerShown: true, headerTitle: 'Paramètres', headerBackTitle: 'Retour', headerStyle: { backgroundColor: '#0D1B2A' }, headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#FFFFFF' }, headerTintColor: '#00C8FF' }}
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
    backgroundColor: '#0D1B2A',
  },
})
