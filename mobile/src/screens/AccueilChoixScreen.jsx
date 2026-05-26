import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../constants/theme'

// Écran d'accueil : permet de choisir son rôle parmi 3 profils
// Rôles : Acheteur (OTP), Contrôleur (code 4 chiffres), Organisateur (email+mdp)
export default function AccueilChoixScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.conteneur}>
        {/* Logo / titre */}
        <Text style={styles.logo}>SENGUICHET</Text>
        <Text style={styles.sousTitre}>Choisissez votre mode</Text>

        {/* Carte : Acheteur */}
        <TouchableOpacity
          style={styles.carte}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('EntrerNumero')}
        >
          <Text style={styles.icone}>🎫</Text>
          <Text style={styles.carteTitre}>Acheter un billet</Text>
          <Text style={styles.carteFleche}>→</Text>
        </TouchableOpacity>

        {/* Carte : Contrôleur */}
        <TouchableOpacity
          style={styles.carte}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ConnexionControleur')}
        >
          <Text style={styles.icone}>📷</Text>
          <Text style={styles.carteTitre}>Scanner</Text>
          <Text style={styles.carteFleche}>→</Text>
        </TouchableOpacity>

        {/* Carte : Organisateur */}
        <TouchableOpacity
          style={styles.carte}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ConnexionOrganisateur')}
        >
          <Text style={styles.icone}>💼</Text>
          <Text style={styles.carteTitre}>Organisateur</Text>
          <Text style={styles.carteFleche}>→</Text>
        </TouchableOpacity>

        {/* Footer : moyens de paiement */}
        <Text style={styles.footer}>
          Paiement Wave & Orange Money
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteneur: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'Outfit_900Black',
    fontSize: 28,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 4,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: colors.mid,
    textAlign: 'center',
    marginBottom: 40,
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  icone: {
    fontSize: 28,
    marginRight: 16,
  },
  carteTitre: {
    flex: 1,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: colors.slate,
  },
  carteFleche: {
    fontSize: 20,
    color: colors.muted,
  },
  footer: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 40,
  },
})
