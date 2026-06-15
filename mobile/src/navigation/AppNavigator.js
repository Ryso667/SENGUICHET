// Navigation principale de l'application
// 3 piles distinctes selon le rôle : acheteur / controleur / organisateur
// Les écrans non-connectés (auth) sont affichés quand aucun rôle n'est actif
import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { NavigationContainer, useFocusEffect, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'
import { listerMesDemandes } from '../services/eventService'
import FloatingTabBar from '../components/FloatingTabBar'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

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
import NotificationsScreen from '../screens/NotificationsScreen'

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
          source={require('../../assets/logo_app.jpeg')}
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
    backgroundColor: 'rgba(121,134,203,0.15)',
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

// Onglets acheteur : 4 tabs avec barre de navigation inférieure
function AcheteurTabs() {
  return (
    <TabBarScrollProvider>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A56DB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
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
          fontFamily: 'PlusJakartaSans_600SemiBold',
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
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
          tabBarLabel: 'Recherche',
          tabBarIcon: ({ color }) => <Feather name="search" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color }) => <Feather name="bell" size={20} color={color} />,
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

// Onglets organisateur : 4 tabs
function OrganisateurTabs() {
  const { deconnecter } = useAuth()
  const [demandesCount, setDemandesCount] = useState(0)
  const badgeRef = useRef(false)

  // Au premier montage : badge = nombre de demandes en attente
  useEffect(() => {
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
    useCallback(() => {
      setDemandesCount(0)
    }, [])
  )

  return (
    <TabBarScrollProvider>
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        header: () => null,
        sceneContainerStyle: { paddingBottom: 80 },
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
    </TabBarScrollProvider>
  )
}

// Wrappers avec header personnalisé par dessus les tabs
function LayoutHeader({ children }) {
  const { deconnecter } = useAuth()
  return (
    <View style={{ flex: 1 }}>
      <OrganisateurHeader title="SENGUICHET" deconnecter={deconnecter} />
      {children}
    </View>
  )
}

function OrganisateurLayout() {
  return <LayoutHeader><OrganisateurTabs /></LayoutHeader>
}

function AcheteurLayout() {
  return <AcheteurTabs />
}

function ControleurLayout() {
  return <LayoutHeader><ControleurTabs /></LayoutHeader>
}

// Onglets du contrôleur : Scanner + Historique
function ControleurTabs() {
  return (
    <TabBarScrollProvider>
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { paddingBottom: 80 },
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
    </TabBarScrollProvider>
  )
}

const navigationRef = createNavigationContainerRef()

// Point d'entrée de la navigation
export default function AppNavigator() {
  const { role, chargement } = useAuth()
  const [isNavReady, setIsNavReady] = useState(false)

  const resetNav = useCallback(() => {
    if (!navigationRef.current?.isReady()) return
    if (role) {
      const routeName = role === 'acheteur' ? 'AcheteurTabs'
        : role === 'controleur' ? 'ControleurTabs'
        : 'OrganisateurTabs'
      navigationRef.current.reset({ index: 0, routes: [{ name: routeName }] })
    } else {
      navigationRef.current.reset({ index: 0, routes: [{ name: 'AcheteurTabs' }] })
    }
  }, [role])

  useEffect(() => {
    if (isNavReady) resetNav()
  }, [role, isNavReady, resetNav])

  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setIsNavReady(true)}>
      {/* Style natif réutilisable pour les headers avec bouton retour */}
      {(() => {
        const headerStyle = {
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
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

            {/* Acheteur connecté ou non-connecté */}
            {(!role || role === 'acheteur') && (
              <>
                <Stack.Screen name="AcheteurTabs" component={AcheteurLayout} />
                <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Ticket" component={TicketScreen} />
                <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Support" component={SupportScreen} options={header('Support')} />
                <Stack.Screen name="Profil" component={ProfilScreen} options={header('Profil')} />
              </>)}

            {/* Contrôleur connecté */}
            {role === 'controleur' && (
              <>
                <Stack.Screen name="ControleurTabs" component={ControleurLayout} />
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
