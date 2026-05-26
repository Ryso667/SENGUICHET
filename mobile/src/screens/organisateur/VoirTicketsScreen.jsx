import { useState } from 'react'
import {
  View, Text, TextInput, SafeAreaView, ScrollView, StyleSheet,
} from 'react-native'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { colors } from '../../constants/theme'

// Écran de consultation des tickets pour un événement
// En mode démo, une recherche factice retourne des tickets mockés
export default function VoirTicketsScreen({ navigation }) {
  const [codeEvenement, setCodeEvenement] = useState('')
  const [tickets, setTickets] = useState(null)

  const handleRechercher = () => {
    const code = codeEvenement.replace(/\D/g, '')
    if (code.length !== 4) {
      alert('Le code doit faire 4 chiffres')
      return
    }
    // Simulation : tickets factices
    setTickets([
      { id: 'TKT-001', telephone: '77 123 45 67', statut: 'Utilisé', date: '26/05/2026' },
      { id: 'TKT-002', telephone: '78 987 65 43', statut: 'Valide', date: '26/05/2026' },
      { id: 'TKT-003', telephone: '76 555 77 88', statut: 'Valide', date: '26/05/2026' },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.conteneur}>
        <Text style={styles.retour} onPress={() => navigation.goBack()}>
          ← Retour
        </Text>

        <Text style={styles.titre}>Voir les tickets</Text>
        <Text style={styles.sousTitre}>
          Entrez le code à 4 chiffres de l'événement
        </Text>

        {/* Saisie du code événement */}
        <TextInput
          style={styles.input}
          value={codeEvenement}
          onChangeText={setCodeEvenement}
          keyboardType="number-pad"
          placeholder="2491"
          placeholderTextColor={colors.muted}
          maxLength={4}
        />

        <View style={{ height: 16 }} />
        <BoutonPrincipal
          titre="Rechercher"
          desactive={codeEvenement.replace(/\D/g, '').length !== 4}
          onPress={handleRechercher}
        />

        {/* Résultats */}
        {tickets && (
          <View style={styles.resultats}>
            <Text style={styles.resultatsTitre}>
              {tickets.length} ticket(s) trouvé(s)
            </Text>
            {tickets.map((t) => (
              <View key={t.id} style={styles.ticketRow}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketId}>{t.id}</Text>
                  <Text style={styles.ticketTel}>{t.telephone}</Text>
                </View>
                <View style={t.statut === 'Utilisé' ? styles.badgeRouge : styles.badgeVert}>
                  <Text style={styles.badgeTexte}>{t.statut}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  retour: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: colors.accent,
    marginBottom: 16,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.slate,
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: colors.mid,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: colors.slate,
    textAlign: 'center',
    letterSpacing: 8,
  },
  resultats: {
    marginTop: 24,
  },
  resultatsTitre: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: colors.slate,
    marginBottom: 12,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketId: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: colors.slate,
  },
  ticketTel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.mid,
    marginTop: 2,
  },
  badgeVert: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRouge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTexte: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#0f172a',
  },
})
