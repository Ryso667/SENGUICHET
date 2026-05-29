// Écran de création d'un événement (organisateur)
// Inclut : nom, catégorie (dropdown), description, date, catégories de billets
// Le code événement 6 chiffres est généré côté service avec expo-crypto
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  View, Text, TextInput, Image, Alert, Modal, FlatList,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import BoutonPrincipal from '../../components/BoutonPrincipal'

import { colors, fonts, spacing, borderRadius } from '../../constants/theme'
import { modifierEvenement, ajouterAudit, creerEvenement } from '../../services/eventService'

const CATEGORIES = [
  'Concert', 'Festival', 'Théâtre', 'Sport', 'Conférence',
  'Atelier', 'Exposition', 'Club / Soirée', 'Gala', 'Autres / Divers',
]

const BILLET_CATEGORIES = [
  'Standard', 'VIP', 'Premium', 'Carré Or', 'Fosse', 'Autre',
]

export default function CreerEvenementScreen({ navigation, route }) {
  const { email } = useAuth()
  const eventExistant = route.params?.event || null
  const [nom, setNom] = useState(eventExistant?.nom || '')
  const [categorie, setCategorie] = useState(eventExistant?.categorie || '')
  const [categorieCustom, setCategorieCustom] = useState('')
  const [date, setDate] = useState(eventExistant?.date || '')
  const [lieu, setLieu] = useState(eventExistant?.lieu || '')
  const [heure, setHeure] = useState(eventExistant?.heure || '')
  const [description, setDescription] = useState(eventExistant?.description || '')
  const [poster, setPoster] = useState(eventExistant?.poster ? { uri: eventExistant.poster } : null)
  const [dateExpanded, setDateExpanded] = useState(false)
  const [heureExpanded, setHeureExpanded] = useState(false)
  // État de navigation du calendrier inline
  const [browseYear, setBrowseYear] = useState(() => date ? parseInt(date.split('-')[0]) : new Date().getFullYear())
  const [browseMonth, setBrowseMonth] = useState(() => date ? parseInt(date.split('-')[1]) - 1 : new Date().getMonth())
  // État du sélecteur d'heure inline
  const [editHour, setEditHour] = useState(() => { const h = parseInt(heure?.split(':')[0]); return isNaN(h) ? 12 : h })
  const [editMinute, setEditMinute] = useState(() => { const m = parseInt(heure?.split(':')[1]); return isNaN(m) ? 0 : Math.floor(m / 5) * 5 })
  const [catVisible, setCatVisible] = useState(false)
  const [recapVisible, setRecapVisible] = useState(false)
  const [billetCatIndex, setBilletCatIndex] = useState(null)
  const [categories, setCategories] = useState(
    eventExistant?.categories?.map(c => ({ nom: c.nom, prix: String(c.prix), capacite: String(c.capacite), id: c.id }))
    || [{ nom: '', prix: '', capacite: '' }]
  )

  const categorieFinale = categorie === 'Autres / Divers' ? categorieCustom : categorie

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8, allowsEditing: true,
    })
    if (!result.canceled) setPoster(result.assets[0])
  }

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

  // --- Constantes et helpers pour le calendrier inline ---
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay()
  const pad = (n) => n.toString().padStart(2, '0')
  // --- Fin helpers calendrier ---

  const handleCreer = async () => {
    if (!nom || !categorie || !date || !lieu || categories.length === 0) {
      Alert.alert('Erreur', 'Remplis tous les champs')
      return
    }
    if (categorie === 'Autres / Divers' && !categorieCustom) {
      Alert.alert('Erreur', 'Précise le nom de la catégorie')
      return
    }
    setRecapVisible(true)
  }

  const handleConfirm = async () => {
    setRecapVisible(false)
    try {
      const data = { nom, date, lieu, heure, categorie: categorieFinale, description, categories, poster }
      if (eventExistant) {
        await modifierEvenement(eventExistant.id, data)
        await ajouterAudit('modification', {
          eventId: eventExistant.id,
          eventNom: nom,
          par: email,
          changements: { nom, date, lieu, heure },
        })
        Alert.alert('✅ Modifié', 'L\'événement a été mis à jour.')
      } else {
        const evt = await creerEvenement({ ...data, email })
        Alert.alert('Événement créé !', `Code : ${evt.code}\nPartage ce code avec les contrôleurs.`)
      }
      navigation.navigate('Dashboard')
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
        <ScrollView contentContainerStyle={styles.conteneur} keyboardShouldPersistTaps="handled">
          <Text style={styles.retour} onPress={() => navigation.navigate('Dashboard')}>
            ← Retour
          </Text>

          <Text style={styles.titre}>{eventExistant ? 'Modifier l\'événement' : 'Créer un événement'}</Text>
          <Text style={styles.sousTitre}>{eventExistant ? 'Modifiez les informations' : 'Remplissez les informations de votre événement'}</Text>

          <Text style={styles.label}>Nom de l'événement</Text>
          <TextInput
            style={styles.input} value={nom} onChangeText={setNom}
            placeholder="Concert, festival..." placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Catégorie d'événement</Text>
          <TouchableOpacity style={styles.input} onPress={() => setCatVisible(true)}>
            <Text style={[styles.inputText, !categorie && { color: colors.muted }]}>
              {categorie || 'Sélectionner une catégorie'}
            </Text>
          </TouchableOpacity>

          {categorie === 'Autres / Divers' && (
            <TextInput
              style={styles.input} value={categorieCustom} onChangeText={setCategorieCustom}
              placeholder="Précisez la catégorie" placeholderTextColor={colors.muted}
            />
          )}

          <Text style={styles.label}>Description (optionnelle)</Text>
          <TextInput
            style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription}
            placeholder="Décrivez votre événement..." placeholderTextColor={colors.muted}
            multiline numberOfLines={3} textAlignVertical="top"
          />

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setDateExpanded(!dateExpanded)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.inputText, !date && { color: colors.muted }]}>
                {date || 'Sélectionner une date'}
              </Text>
              <Feather name={dateExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mid} />
            </View>
          </TouchableOpacity>
          {dateExpanded && (
            <View style={styles.calendar}>
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={() => {
                  if (browseMonth === 0) { setBrowseMonth(11); setBrowseYear(browseYear - 1) }
                  else setBrowseMonth(browseMonth - 1)
                }}>
                  <Feather name="chevron-left" size={22} color={colors.accent} />
                </TouchableOpacity>
                <Text style={styles.calHeaderText}>{MONTHS[browseMonth]} {browseYear}</Text>
                <TouchableOpacity onPress={() => {
                  if (browseMonth === 11) { setBrowseMonth(0); setBrowseYear(browseYear + 1) }
                  else setBrowseMonth(browseMonth + 1)
                }}>
                  <Feather name="chevron-right" size={22} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <View style={styles.calWeek}>
                {DAYS.map(d => <Text key={d} style={styles.calWeekDay}>{d}</Text>)}
              </View>
              <View style={styles.calGrid}>
                {[...Array(getFirstDay(browseYear, browseMonth))].map((_, i) => (
                  <View key={`e${i}`} style={styles.calDay} />
                ))}
                {[...Array(getDaysInMonth(browseYear, browseMonth))].map((_, i) => {
                  const day = i + 1
                  const dateStr = `${browseYear}-${pad(browseMonth + 1)}-${pad(day)}`
                  const selected = date === dateStr
                  return (
                    <TouchableOpacity
                      key={day} style={[styles.calDay, selected && styles.calDaySelected]}
                      onPress={() => { setDate(dateStr); setDateExpanded(false) }}
                    >
                      <Text style={[styles.calDayText, selected && styles.calDayTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}

          <Text style={styles.label}>Lieu</Text>
          <TextInput
            style={styles.input} value={lieu} onChangeText={setLieu}
            placeholder="Monument Renaissance, Grand Théâtre..." placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Horaire</Text>
          <TouchableOpacity style={styles.input} onPress={() => setHeureExpanded(!heureExpanded)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.inputText, !heure && { color: colors.muted }]}>
                {heure || 'Choisir un horaire'}
              </Text>
              <Feather name={heureExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mid} />
            </View>
          </TouchableOpacity>
          {heureExpanded && (
            <View style={styles.timePicker}>
              <View style={styles.timeCol}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => {
                  const h = editHour === 23 ? 0 : editHour + 1
                  setEditHour(h); setHeure(`${pad(h)}:${pad(editMinute)}`)
                }}>
                  <Feather name="chevron-up" size={22} color={colors.accent} />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{pad(editHour)}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => {
                  const h = editHour === 0 ? 23 : editHour - 1
                  setEditHour(h); setHeure(`${pad(h)}:${pad(editMinute)}`)
                }}>
                  <Feather name="chevron-down" size={22} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <Text style={styles.timeSep}>:</Text>
              <View style={styles.timeCol}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => {
                  const m = editMinute >= 55 ? 0 : editMinute + 5
                  setEditMinute(m); setHeure(`${pad(editHour)}:${pad(m)}`)
                }}>
                  <Feather name="chevron-up" size={22} color={colors.accent} />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{pad(editMinute)}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => {
                  const m = editMinute <= 0 ? 55 : editMinute - 5
                  setEditMinute(m); setHeure(`${pad(editHour)}:${pad(m)}`)
                }}>
                  <Feather name="chevron-down" size={22} color={colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.label}>Affiche (optionnelle)</Text>
          <TouchableOpacity style={styles.posterBtn} onPress={pickImage}>
            {poster ? (
              <Image source={{ uri: poster.uri }} style={styles.posterPreview} />
            ) : (
              <>
                <Feather name="image" size={20} color={colors.muted} />
                <Text style={styles.posterBtnText}>Ajouter une affiche</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Catégories de billets</Text>
          {categories.map((cat, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <TouchableOpacity style={styles.input} onPress={() => setBilletCatIndex(i)}>
                <Text style={[styles.inputText, !cat.nom && { color: colors.muted }]}>
                  {cat.nom || 'Choisir une catégorie'}
                </Text>
              </TouchableOpacity>
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
          <BoutonPrincipal titre={eventExistant ? 'Modifier l\'événement' : 'Créer l\'événement'} onPress={handleCreer} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={catVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setCatVisible(false)}>
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Catégorie d'événement</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, categorie === item && styles.pickerItemActive]}
                  onPress={() => { setCategorie(item); setCatVisible(false) }}
                >
                  <Text style={[styles.pickerItemText, categorie === item && styles.pickerItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={billetCatIndex !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setBilletCatIndex(null)}>
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Type de billet</Text>
            <FlatList
              data={BILLET_CATEGORIES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, categories[billetCatIndex]?.nom === item && styles.pickerItemActive]}
                  onPress={() => {
                    if (billetCatIndex !== null) updateCat(billetCatIndex, 'nom', item)
                    setBilletCatIndex(null)
                  }}
                >
                  <Text style={[styles.pickerItemText, categories[billetCatIndex]?.nom === item && styles.pickerItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={recapVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.recap}>
            <Text style={styles.recapTitle}>Récapitulatif</Text>

            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Nom</Text>
              <Text style={styles.recapValue}>{nom}</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Catégorie</Text>
              <Text style={styles.recapValue}>{categorieFinale}</Text>
            </View>
            {!!description && (
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>Description</Text>
                <Text style={styles.recapValue}>{description}</Text>
              </View>
            )}
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Date</Text>
              <Text style={styles.recapValue}>{date}</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Lieu</Text>
              <Text style={styles.recapValue}>{lieu}</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Horaire</Text>
              <Text style={styles.recapValue}>{heure}</Text>
            </View>
            {poster && (
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>Affiche</Text>
                <Image source={{ uri: poster.uri }} style={[styles.posterPreview, { height: 100 }]} />
              </View>
            )}
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Billets</Text>
              <Text style={styles.recapValue}>
                {categories.map(c => `${c.nom} (${c.prix}F · ${c.capacite})`).join(', ')}
              </Text>
            </View>

            <View style={styles.recapActions}>
              <TouchableOpacity style={styles.recapBtn} onPress={() => setRecapVisible(false)}>
                <Text style={styles.recapBtnText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.recapBtn, styles.recapBtnPrimary]} onPress={handleConfirm}>
                <Text style={[styles.recapBtnText, styles.recapBtnTextPrimary]}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  conteneur: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  retour: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.accent, marginBottom: 16 },
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: colors.slate, marginBottom: 8 },
  sousTitre: { fontFamily: fonts.jakarta.regular, fontSize: 15, color: colors.mid, marginBottom: 32 },
  label: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.slate, marginBottom: 6 },
  input: {
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, height: 56, justifyContent: 'center', marginBottom: 16,
  },
  inputText: { fontFamily: fonts.outfit.regular, fontSize: 16, color: colors.slate },
  textarea: { height: 80, paddingTop: 16 },
  removeCat: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.accent, textAlign: 'right', marginTop: -8 },
  posterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, justifyContent: 'center', marginBottom: 16,
  },
  posterBtnText: { fontFamily: fonts.outfit.regular, fontSize: 14, color: colors.muted },
  posterPreview: { width: '100%', height: 160, borderRadius: 12, resizeMode: 'cover' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  recap: { backgroundColor: colors.white, borderRadius: 20, padding: 24 },
  recapTitle: { fontFamily: fonts.outfit.bold, fontSize: 20, color: colors.slate, textAlign: 'center', marginBottom: 20 },
  recapRow: { marginBottom: 14 },
  recapLabel: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.mid, marginBottom: 2 },
  recapValue: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.slate },
  recapActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  recapBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.border },
  recapBtnPrimary: { backgroundColor: colors.accent },
  recapBtnText: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.slate },
  recapBtnTextPrimary: { color: colors.white },
  picker: { backgroundColor: colors.white, borderRadius: 20, padding: 20, maxHeight: 400 },
  pickerTitle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.slate, marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  pickerItemActive: { backgroundColor: colors.bg },
  pickerItemText: { fontFamily: fonts.outfit.regular, fontSize: 16, color: colors.slate },
  pickerItemTextActive: { fontFamily: fonts.outfit.semiBold, color: colors.accent },
  // Calendrier inline
  calendar: {
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 16,
  },
  calHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  calHeaderText: { fontFamily: fonts.outfit.semiBold, fontSize: 16, color: colors.slate },
  calWeek: { flexDirection: 'row', marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', fontFamily: fonts.outfit.semiBold, fontSize: 13, color: colors.mid, paddingVertical: 4 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  calDaySelected: { backgroundColor: colors.accent },
  calDayText: { fontFamily: fonts.outfit.regular, fontSize: 14, color: colors.slate },
  calDayTextSelected: { fontFamily: fonts.outfit.semiBold, color: colors.white },
  // Sélecteur d'heure inline
  timePicker: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 16, marginBottom: 16,
  },
  timeCol: { alignItems: 'center', paddingHorizontal: 20 },
  timeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  timeValue: { fontFamily: fonts.outfit.bold, fontSize: 36, color: colors.slate, marginVertical: 8 },
  timeSep: { fontFamily: fonts.outfit.bold, fontSize: 36, color: colors.mid, marginHorizontal: 4 },
})
