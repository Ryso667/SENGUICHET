import { useState } from 'react'
import {
  View, Text, TextInput, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { colors } from '../../constants/theme'

// Formulaire de création d'un événement (organisateur)
// En mode démo, simule la création et affiche un code de scan factice
export default function CreerEvenementScreen({ navigation }) {
  const [titre, setTitre] = useState('')
  const [date, setDate] = useState('')
  const [prix, setPrix] = useState('')
  const [places, setPlaces] = useState('')
  const [chargement, setChargement] = useState(false)

  const handleCreer = async () => {
    if (!titre || !date || !prix || !places) return
    setChargement(true)
    // Simulation : génère un code de scan 4 chiffres
    const scanCode = String(Math.floor(1000 + Math.random() * 9000))
    setTimeout(() => {
      setChargement(false)
      alert(`Événement "${titre}" créé !\nCode de scan : ${scanCode}`)
      navigation.goBack()
    }, 1000)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteneur}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.retour} onPress={() => navigation.goBack()}>
            ← Retour
          </Text>

          <Text style={styles.titre}>Créer un événement</Text>
          <Text style={styles.sousTitre}>
            Remplissez les informations de votre événement
          </Text>

          <Text style={styles.label}>Nom de l'événement</Text>
          <TextInput
            style={styles.input}
            value={titre}
            onChangeText={setTitre}
            placeholder="Concert, festival..."
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Prix (CFA)</Text>
          <TextInput
            style={styles.input}
            value={prix}
            onChangeText={setPrix}
            keyboardType="numeric"
            placeholder="5000"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Nombre de places</Text>
          <TextInput
            style={styles.input}
            value={places}
            onChangeText={setPlaces}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor={colors.muted}
          />

          <View style={{ height: 24 }} />
          <BoutonPrincipal
            titre="Créer l'événement"
            chargement={chargement}
            desactive={!titre || !date || !prix || !places}
            onPress={handleCreer}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
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
    marginBottom: 32,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: colors.slate,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: colors.slate,
    marginBottom: 16,
  },
})
