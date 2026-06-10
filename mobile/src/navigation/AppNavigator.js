// Navigation principale de l'application
// 3 piles distinctes selon le rôle : acheteur / controleur / organisateur
// Les écrans non-connectés (auth) sont affichés quand aucun rôle n'est actif
import React, { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { NavigationContainer, useFocusEffect, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { hapticLight } from '../utils/haptics'
import { listerMesDemandes } from '../services/eventService'
import { API_BASE_URL } from '../config'
import { colors, fonts, glass } from '../constants/theme'

// Écrans auth (aucun rôle)
import AccueilChoixScreen from '../screens/AccueilChoixScreen'
import SocialAuthScreen from '../screens/auth/SocialAuthScreen'
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
import SupportScreen from '../screens/SupportScreen'
import WebViewWaveScreen from '../screens/WebViewWaveScreen'

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

// Nouveaux écrans (gap 2, 3, 5)
import ChangerMotDePasseScreen from '../screens/organisateur/ChangerMotDePasseScreen'
import ProfilScreen from '../screens/ProfilScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Composant bouton de tab avec retour haptique au toucher
const HapticTabButton = ({ children, onPress, ...props }) => {
  const handlePress = () => {
    hapticLight()
    if (onPress) onPress()
  }
  return (
    <TouchableOpacity {...props} onPress={handlePress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  )
}

// Header réutilisable pour les tabs organisateur
function OrganisateurHeader({ title, deconnecter, badgeCount }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[headerStyles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={deconnecter} style={headerStyles.left}>
        <Feather name="log-out" size={20} color={colors.danger} />
      </TouchableOpacity>
      <Text style={headerStyles.title}>{title}</Text>
      <View style={headerStyles.right}>
        <Image
          source={{ uri: `${API_BASE_URL.replace('/api', '')}/uploads/logo.jpg` }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          resizeMode="cover"
        />
      </View>
    </View>
  )
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
    fontFamily: fonts.outfit.bold,
    color: colors.text,
  },
  right: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,200,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {},
  logoText: {
    fontSize: 16,
    fontFamily: fonts.outfit.extraBold,
    color: colors.accent,
  },
})

// Onglets organisateur : 4 tabs
function OrganisateurTabs() {
  const { deconnecter } = useAuth()
  const [demandesCount, setDemandesCount] = React.useState(0)
  const badgeRef = React.useRef(false)

  // Au premier montage : badge = nombre de demandes en attente
  React.useEffect(() => {
    (async () => {
      try {
        const data = await listerMesDemandes()
        const pending = (data || []).filter(d => d.statut === 'soumis' || d.statut === 'en_analyse').length
        setDemandesCount(pending)
      } catch {}
    })()
  }, [])

  // Dès qu'on arrive sur l'onglet MesDemandes : badge disparaît
  useFocusEffect(
    React.useCallback(() => {
      setDemandesCount(0)
    }, [])
  )

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => null,
        tabBarButton: (props) => <HapticTabButton {...props} />,
        tabBarStyle: {
          backgroundColor: glass.bgHeavy,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
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
                  backgroundColor: colors.danger,
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
    <View style={{ flex: 1 }}>
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
        headerStyle: { backgroundColor: glass.bg },
        headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: colors.text },
        headerLeft: () => (
          <Image
            source={{ uri: `${API_BASE_URL.replace('/api', '')}/uploads/logo.jpg` }}
            style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 16 }}
            resizeMode="cover"
          />
        ),
        headerRight: () => (
          <TouchableOpacity onPress={deconnecter} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 14, color: colors.danger, fontFamily: 'Outfit_600SemiBold' }}>
              Quitter
            </Text>
          </TouchableOpacity>
        ),
        tabBarButton: (props) => <HapticTabButton {...props} />,
        tabBarStyle: {
          backgroundColor: glass.bgHeavy,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
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

const navigationRef = createNavigationContainerRef()

// Point d'entrée de la navigation
export default function AppNavigator() {
  const { role, chargement } = useAuth()

  // Redirige automatiquement selon le rôle (ou vers AccueilChoix si déconnecté)
  useEffect(() => {
    const pret = navigationRef.current?.isReady()
    console.log(`[Nav] role="${role}" isReady=${pret}`)
    if (pret) {
      if (role) {
        const routeName = role === 'acheteur' ? 'Home'
          : role === 'controleur' ? 'ControleurTabs'
          : 'OrganisateurTabs'
        console.log(`[Nav] reset vers ${routeName}`)
        navigationRef.current.reset({ index: 0, routes: [{ name: routeName }] })
      } else {
        console.log('[Nav] reset vers AccueilChoix')
        navigationRef.current.reset({ index: 0, routes: [{ name: 'AccueilChoix' }] })
      }
    }
  }, [role])

  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Style natif réutilisable pour les headers avec bouton retour */}
      {(() => {
        const headerStyle = {
          headerShown: true,
          headerStyle: { backgroundColor: glass.bg },
          headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: colors.text },
          headerTintColor: colors.accent,
          headerBackTitle: 'Retour',
        }
        const header = (titre) => ({ ...headerStyle, headerTitle: titre })

        return (
          <Stack.Navigator screenOptions={{ 
            headerShown: false, 
            gestureEnabled: true,
            animation: 'slide_from_right',
            animationDuration: 250,
          }}>

            {/* Écrans auth toujours disponibles */}
            <Stack.Screen name="AccueilChoix" component={AccueilChoixScreen} />
            <Stack.Screen name="SocialAuth" component={SocialAuthScreen} />
            <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} options={header('Connexion')} />
            <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} options={header('Connexion')} />
            <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} options={header('Inscription')} />
            <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />

            {/* Acheteur connecté */}
            {role === 'acheteur' && (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="EventSearch" component={EventSearchScreen} />
                <Stack.Screen name="EventDetail" component={EventDetailScreen} options={header('Détail')} />
                <Stack.Screen name="Ticket" component={TicketScreen} />
                <Stack.Screen name="MesTickets" component={MesTicketsScreen} />
                <Stack.Screen name="Support" component={SupportScreen} />
                <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Profil" component={ProfilScreen} options={header('Profil')} />
              </>)}

            {/* Contrôleur connecté */}
            {role === 'controleur' && (
              <>
                <Stack.Screen name="ControleurTabs" component={ControleurTabs} />
                <Stack.Screen name="Profil" component={ProfilScreen} options={header('Profil')} />
              </>
            )}

            {/* Organisateur connecté : bottom tabs + stack screens */}
            {role === 'organisateur' && (
              <>
                <Stack.Screen name="OrganisateurTabs" component={OrganisateurLayout} />
                <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} options={header('Détail')} />
                <Stack.Screen name="Parametres" component={ParametresScreen} options={header('Paramètres')} />
                <Stack.Screen name="ChangerMotDePasse" component={ChangerMotDePasseScreen} options={header('Changer le mot de passe')} />
              </>
            )}

          </Stack.Navigator>
        )
      })()}
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
