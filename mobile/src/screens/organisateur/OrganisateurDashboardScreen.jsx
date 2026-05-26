import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { colors } from '../../constants/theme'

// Tableau de bord de l'organisateur
// Affiche les stats des événements et permet de naviguer
export default function OrganisateurDashboardScreen({ navigation }) {
  const { email, deconnecter } = useAuth()

  const handleDeconnexion = async () => {
    await deconnecter()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.conteneur}>
        {/* Entête avec email */}
        <Text style={styles.titre}>Bonjour 👋</Text>
        <Text style={styles.email}>{email}</Text>

        {/* Cartes de stats (placeholders en mode démo) */}
        <View style={styles.grille}>
          <View style={styles.statCarte}>
            <Text style={styles.statValeur}>0</Text>
            <Text style={styles.statLabel}>Événements</Text>
          </View>
          <View style={styles.statCarte}>
            <Text style={styles.statValeur}>0</Text>
            <Text style={styles.statLabel}>Billets vendus</Text>
          </View>
          <View style={styles.statCarte}>
            <Text style={styles.statValeur}>0 CFA</Text>
            <Text style={styles.statLabel}>Recettes</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <BoutonPrincipal
            titre="Créer un événement"
            onPress={() => navigation.navigate('CreerEvenement')}
          />
          <View style={{ height: 12 }} />
          <BoutonPrincipal
            titre="Voir les tickets"
            onPress={() => navigation.navigate('VoirTickets')}
          />
        </View>

        {/* Déconnexion */}
        <Text style={styles.deconnexion} onPress={handleDeconnexion}>
          Se déconnecter
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteneur: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: colors.slate,
    marginBottom: 4,
  },
  email: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: colors.mid,
    marginBottom: 32,
  },
  grille: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  statCarte: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  statValeur: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: colors.mid,
    textAlign: 'center',
  },
  actions: {
    marginBottom: 24,
  },
  deconnexion: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: colors.red,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
})
