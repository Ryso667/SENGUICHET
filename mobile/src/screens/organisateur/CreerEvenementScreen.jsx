import { useState } from 'react'
import {
  View, Text, TextInput, SafeAreaView, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import DatePickerModal from '../../components/DatePickerModal'
import { colors, fonts, spacing, borderRadius } from '../../constants/theme'
import { creerEvenement } from '../../services/eventService'

export default function CreerEvenementScreen({ navigation }) {
  const [nom, setNom] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [dateVisible, setDateVisible] = useState(false)
  const [categories, setCategories] = useState([{ nom: '', prix: '', capacite: '' }])

  const updateCat = (index, field, value) => {
    const next = [...categories]
    next[index] = { ...next[index], [field]: value }
    setCategories(next)
  }

  const addCat = () => {
    setCategories([...categories, { nom: '', prix: '', capacite: '' }])
  }

  const removeCat = (index) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const handleCreer = async () => {
    if (!nom || !date || categories.length === 0) {
      Alert.alert('Erreur', 'Remplis tous les champs')
      return
    }
    try {
      const evt = await creerEvenement({ nom, date, description, categories })
      Alert.alert('Événement créé !', `Code événement : ${evt.code}\nPartage ce code avec les contrôleurs.`)
      navigation.goBack()
    } catch (e) {
      Alert.alert('Erreur', e.message)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
            value={nom}
            onChangeText={setNom}
            placeholder="Concert, festival..."
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Description (optionnelle)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre événement..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setDateVisible(true)}>
            <Text style={[styles.dateText, !date && { color: colors.muted }]}>
              {date || 'Sélectionner une date'}
            </Text>
          </TouchableOpacity>

          <DatePickerModal
            visible={dateVisible}
            onClose={() => setDateVisible(false)}
            onSelect={(d) => setDate(d)}
          />

          <Text style={styles.label}>Catégories</Text>
          {categories.map((cat, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <TextInput style={styles.input} placeholder="Nom de la catégorie"
                value={cat.nom} onChangeText={v => updateCat(i, 'nom', v)} />
              <TextInput style={styles.input} placeholder="Prix (CFA)" keyboardType="numeric"
                value={String(cat.prix)} onChangeText={v => updateCat(i, 'prix', v)} />
              <TextInput style={styles.input} placeholder="Capacité" keyboardType="numeric"
                value={String(cat.capacite)} onChangeText={v => updateCat(i, 'capacite', v)} />
              {categories.length > 1 && (
                <Text style={styles.removeCat} onPress={() => removeCat(i)}>× Supprimer</Text>
              )}
            </View>
          ))}
          <BoutonPrincipal titre="+ Ajouter une catégorie" onPress={addCat} />

          <View style={{ height: 24 }} />
          <BoutonPrincipal
            titre="Créer l'événement"
            onPress={handleCreer}
          />
          <View style={{ height: 40 }} />
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
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.accent,
    marginBottom: 16,
  },
  titre: {
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    color: colors.slate,
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 15,
    color: colors.mid,
    marginBottom: 32,
  },
  label: {
    fontFamily: fonts.outfit.semiBold,
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
    fontFamily: fonts.outfit.regular,
    fontSize: 16,
    color: colors.slate,
    marginBottom: 16,
  },
  textarea: {
    height: 80,
    paddingTop: 16,
  },
  dateBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontFamily: fonts.outfit.regular,
    fontSize: 16,
    color: colors.slate,
  },
  removeCat: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: colors.accent,
    textAlign: 'right',
    marginTop: -8,
  },
})
