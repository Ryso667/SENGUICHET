// Écran de création d'événement (organisateur) — assistant 3 étapes
// Calqué sur le web : Informations générales → Billetterie → Récapitulatif
import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  View, Text, TextInput, Image, Alert, FlatList, Modal,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import BoutonPrincipal from '../../components/BoutonPrincipal'

import { colors, fonts } from '../../constants/theme'
import { creerEvenementAPI } from '../../services/eventService'

const CATEGORIES = [
  'Concert', 'Festival', 'Théâtre', 'Sport', 'Conférence',
  'Atelier', 'Exposition', 'Club / Soirée', 'Gala', 'Autres / Divers',
]

const VILLES = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Touba', 'Kaolack', 'Autre',
]

const BILLET_CATEGORIES = [
  'Standard', 'VIP', 'Premium', 'Carré Or', 'Fosse', 'Autre',
]

const STEPS = [
  { num: 1, label: 'Informations générales' },
  { num: 2, label: 'Billetterie' },
  { num: 3, label: 'Récapitulatif' },
]

// Composant réutilisable pour les champs de formulaire avec label + erreur
// Placé à l'extérieur du composant principal pour éviter le remontage du TextInput à chaque render
const ChampInput = ({ label, value, onChange, placeholder, multiline, keyboardType, errorKey, errors }) => (
  <>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={[s.input, multiline && s.textarea, errorKey && errors?.[errorKey] && s.inputError]}
      value={value} onChangeText={onChange}
      placeholder={placeholder} placeholderTextColor={colors.muted}
      multiline={multiline} numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : undefined}
      keyboardType={keyboardType}
    />
    {errorKey && errors?.[errorKey] && <Text style={s.errorText}>{errors[errorKey]}</Text>}
  </>
)

// Stepper — 3 étapes avec cercle + légende
const Stepper = ({ current }) => (
  <View style={s.stepperRow}>
    {STEPS.map((step, i) => {
      const done = current > step.num
      const active = current === step.num
      return (
        <View key={step.num} style={s.stepperItem}>
          <View style={[s.stepperCircle, done && s.stepperCircleDone, active && s.stepperCircleActive]}>
            <Text style={[s.stepperCircleText, (done || active) && s.stepperCircleTextActive]}>
              {done ? '✓' : step.num}
            </Text>
          </View>
          <Text style={[s.stepperLabel, active && s.stepperLabelActive, done && s.stepperLabelDone]} numberOfLines={1}>
            {step.label}
          </Text>
          {i < STEPS.length - 1 && <View style={[s.stepperLine, done && s.stepperLineDone]} />}
        </View>
      )
    })}
  </View>
)

export default function CreerEvenementScreen({ navigation }) {
  const { user } = useAuth()
  const scrollRef = useRef(null)

  const [step, setStep] = useState(1)

  // Step 1 — Informations générales
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState('')
  const [categorieCustom, setCategorieCustom] = useState('')
  const [description, setDescription] = useState('')
  const [capacite, setCapacite] = useState('')
  const [date, setDate] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [heure, setHeure] = useState('')
  const [lieu, setLieu] = useState('')
  const [ville, setVille] = useState('')
  const [poster, setPoster] = useState(null)
  // Calendrier inline
  const [dateExpanded, setDateExpanded] = useState(false)
  const [dateFinExpanded, setDateFinExpanded] = useState(false)
  const [heureExpanded, setHeureExpanded] = useState(false)
  const [browseYear, setBrowseYear] = useState(() => date ? parseInt(date.split('-')[0]) : new Date().getFullYear())
  const [browseMonth, setBrowseMonth] = useState(() => date ? parseInt(date.split('-')[1]) - 1 : new Date().getMonth())
  const [browseYearFin, setBrowseYearFin] = useState(() => dateFin ? parseInt(dateFin.split('-')[0]) : new Date().getFullYear())
  const [browseMonthFin, setBrowseMonthFin] = useState(() => dateFin ? parseInt(dateFin.split('-')[1]) - 1 : new Date().getMonth())
  const [editHour, setEditHour] = useState(() => { const h = parseInt(heure?.split(':')[0]); return isNaN(h) ? 12 : h })
  const [editMinute, setEditMinute] = useState(() => { const m = parseInt(heure?.split(':')[1]); return isNaN(m) ? 0 : Math.floor(m / 5) * 5 })

  // Step 2 — Billetterie
  const [categories, setCategories] = useState([{ nom: '', prix: '', capacite: '' }])
  const [promoActif, setPromoActif] = useState(false)
  const [promo, setPromo] = useState({ code: '', type: 'pourcentage', valeur: '', limite: '' })

  // Pickers
  const [catVisible, setCatVisible] = useState(false)
  const [billetCatIndex, setBilletCatIndex] = useState(null)
  const [villeVisible, setVilleVisible] = useState(false)

  // Validation & soumission
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const categorieFinale = categorie === 'Autres / Divers' ? categorieCustom : categorie

  // Helpers calendrier
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay()
  const pad = (n) => n.toString().padStart(2, '0')

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

  // --- Validation par étape ---
  const validateStep1 = () => {
    const e = {}
    if (!nom || nom.trim().length < 3) e.nom = 'Minimum 3 caractères'
    if (!categorie) e.categorie = 'Choisissez une catégorie'
    if (!date) e.date = 'Date requise'
    if (!heure) e.heure = 'Heure requise'
    if (!lieu || lieu.trim().length < 2) e.lieu = 'Lieu requis'
    if (!ville) e.ville = 'Ville requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    const hasEmpty = categories.some(c => !c.nom || !c.prix || !c.capacite)
    if (hasEmpty) e.billets = 'Chaque type de billet doit avoir un nom, un prix et une capacité'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const gotoStep = (s) => {
    setErrors({})
    setStep(s)
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) gotoStep(2)
    else if (step === 2 && validateStep2()) gotoStep(3)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const data = { nom, date, dateFin, lieu, ville, heure, categorie: categorieFinale, description, capacite, categories, poster, promo: promoActif ? promo : null }
      await creerEvenementAPI(data)
      Alert.alert('Événement créé !', 'En attente de validation par l\'administrateur.')
      navigation.navigate('Dashboard')
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de contacter le serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <>
      <Text style={s.sectionTitle}>Informations générales</Text>

      <ChampInput label="Nom de l'événement" value={nom} onChange={setNom} placeholder="Concert, festival..." errorKey="nom" errors={errors} />

      <Text style={s.label}>Catégorie d'événement</Text>
      <TouchableOpacity style={[s.input, errors.categorie && s.inputError]} onPress={() => setCatVisible(true)}>
        <Text style={[s.inputText, !categorie && { color: colors.muted }]}>{categorie || 'Sélectionner une catégorie'}</Text>
      </TouchableOpacity>
      {errors.categorie && <Text style={s.errorText}>{errors.categorie}</Text>}
      {categorie === 'Autres / Divers' && (
        <TextInput style={s.input} value={categorieCustom} onChangeText={setCategorieCustom}
          placeholder="Précisez la catégorie" placeholderTextColor={colors.muted} />
      )}

      <ChampInput label="Description (optionnelle)" value={description} onChange={setDescription}
        placeholder="Décrivez votre événement..." multiline errors={errors} />

      <Text style={s.label}>Date</Text>
      <TouchableOpacity style={[s.input, errors.date && s.inputError]} onPress={() => setDateExpanded(!dateExpanded)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.inputText, !date && { color: colors.muted }]}>{date || 'Sélectionner une date'}</Text>
          <Feather name={dateExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mid} />
        </View>
      </TouchableOpacity>
      {errors.date && <Text style={s.errorText}>{errors.date}</Text>}
      {dateExpanded && renderCalendar('date')}

      <Text style={s.label}>Date de fin (optionnelle)</Text>
      <TouchableOpacity style={s.input} onPress={() => setDateFinExpanded(!dateFinExpanded)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.inputText, !dateFin && { color: colors.muted }]}>{dateFin || 'Même jour (par défaut)'}</Text>
          <Feather name={dateFinExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mid} />
        </View>
      </TouchableOpacity>
      {dateFinExpanded && renderCalendar('dateFin')}

      <Text style={s.label}>Horaire</Text>
      <TouchableOpacity style={[s.input, errors.heure && s.inputError]} onPress={() => setHeureExpanded(!heureExpanded)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.inputText, !heure && { color: colors.muted }]}>{heure || 'Choisir un horaire'}</Text>
          <Feather name={heureExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mid} />
        </View>
      </TouchableOpacity>
      {errors.heure && <Text style={s.errorText}>{errors.heure}</Text>}
      {heureExpanded && renderTimePicker()}

      <Text style={s.label}>Capacité totale</Text>
      <TextInput style={s.input} value={capacite} onChangeText={setCapacite}
        placeholder="Ex: 1000" keyboardType="numeric" placeholderTextColor={colors.muted} />

      <ChampInput label="Lieu" value={lieu} onChange={setLieu} placeholder="Monument Renaissance, Grand Théâtre..." errorKey="lieu" errors={errors} />

      <Text style={s.label}>Ville</Text>
      <TouchableOpacity style={[s.input, errors.ville && s.inputError]} onPress={() => setVilleVisible(true)}>
        <Text style={[s.inputText, !ville && { color: colors.muted }]}>{ville || 'Sélectionner une ville'}</Text>
      </TouchableOpacity>
      {errors.ville && <Text style={s.errorText}>{errors.ville}</Text>}

      <Text style={s.label}>Affiche (optionnelle)</Text>
      <TouchableOpacity style={s.posterBtn} onPress={pickImage}>
        {poster ? (
          <Image source={{ uri: poster.uri }} style={s.posterPreview} />
        ) : (
          <>
            <Feather name="image" size={20} color={colors.muted} />
            <Text style={s.posterBtnText}>Ajouter une affiche</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={s.navRow}>
        <View style={{ flex: 1 }} />
        <BoutonPrincipal titre="Suivant →" onPress={handleNext} />
      </View>
    </>
  )

  const renderStep2 = () => (
    <>
      <Text style={s.sectionTitle}>Billetterie</Text>

      <Text style={s.label}>Catégories de billets</Text>
      {categories.map((cat, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <TouchableOpacity style={s.input} onPress={() => setBilletCatIndex(i)}>
            <Text style={[s.inputText, !cat.nom && { color: colors.muted }]}>
              {cat.nom || 'Choisir une catégorie'}
            </Text>
          </TouchableOpacity>
          <TextInput style={s.input} placeholder="Prix (CFA)" keyboardType="numeric"
            value={String(cat.prix)} onChangeText={v => updateCat(i, 'prix', v)} />
          <TextInput style={s.input} placeholder="Capacité" keyboardType="numeric"
            value={String(cat.capacite)} onChangeText={v => updateCat(i, 'capacite', v)} />
          {categories.length > 1 && (
            <Text style={s.removeCat} onPress={() => removeCat(i)}>× Supprimer</Text>
          )}
        </View>
      ))}
      <BoutonPrincipal titre="+ Ajouter une catégorie" onPress={addCat} />
      {errors.billets && <Text style={[s.errorText, { marginTop: 8 }]}>{errors.billets}</Text>}

      <View style={{ height: 24 }} />

      {/* Codes promo */}
      <Text style={s.label}>Code promo (optionnel)</Text>
      <TouchableOpacity style={s.promoToggle} onPress={() => setPromoActif(!promoActif)}>
        <View style={[s.promoToggleTrack, promoActif && s.promoToggleTrackActive]}>
          <View style={[s.promoToggleThumb, promoActif && s.promoToggleThumbActive]} />
        </View>
        <Text style={s.promoToggleText}>Activer un code promo</Text>
      </TouchableOpacity>

      {promoActif && (
        <View style={s.promoSection}>
          <TextInput style={s.input} placeholder="Code (ex: PROMO20)"
            value={promo.code} onChangeText={v => setPromo(p => ({...p, code: v}))}
            placeholderTextColor={colors.muted} autoCapitalize="characters" />
          <View style={s.promoTypeRow}>
            <TouchableOpacity style={[s.promoTypeBtn, promo.type === 'pourcentage' && s.promoTypeBtnActive]}
              onPress={() => setPromo(p => ({...p, type: 'pourcentage'}))}>
              <Text style={[s.promoTypeText, promo.type === 'pourcentage' && s.promoTypeTextActive]}>Pourcentage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.promoTypeBtn, promo.type === 'fixe' && s.promoTypeBtnActive]}
              onPress={() => setPromo(p => ({...p, type: 'fixe'}))}>
              <Text style={[s.promoTypeText, promo.type === 'fixe' && s.promoTypeTextActive]}>Montant fixe</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={s.input}
            placeholder={promo.type === 'pourcentage' ? 'Valeur (%)' : 'Valeur (FCFA)'}
            value={promo.valeur} onChangeText={v => setPromo(p => ({...p, valeur: v}))}
            keyboardType="numeric" placeholderTextColor={colors.muted} />
          <TextInput style={s.input} placeholder="Limite d'utilisation"
            value={promo.limite} onChangeText={v => setPromo(p => ({...p, limite: v}))}
            keyboardType="numeric" placeholderTextColor={colors.muted} />
        </View>
      )}

      <View style={s.navRow}>
        <View style={{ flex: 1 }} />
        <BoutonPrincipal titre="Suivant →" onPress={handleNext} />
      </View>
    </>
  )

  const renderStep3 = () => (
    <>
      <Text style={s.sectionTitle}>Récapitulatif</Text>

      <View style={s.recapCard}>
        <View style={s.recapRow}>
          <Text style={s.recapLabel}>Nom</Text>
          <Text style={s.recapValue}>{nom}</Text>
        </View>
        <View style={s.recapRow}>
          <Text style={s.recapLabel}>Catégorie</Text>
          <Text style={s.recapValue}>{categorieFinale}</Text>
        </View>
        {!!description && (
          <View style={s.recapRow}>
            <Text style={s.recapLabel}>Description</Text>
            <Text style={s.recapValue} numberOfLines={3}>{description}</Text>
          </View>
        )}
        <View style={s.recapRow}>
          <Text style={s.recapLabel}>Date</Text>
          <Text style={s.recapValue}>{date}{dateFin ? ` — ${dateFin}` : ''} à {heure}</Text>
        </View>
        <View style={s.recapRow}>
          <Text style={s.recapLabel}>Lieu</Text>
          <Text style={s.recapValue}>{lieu}{ville ? `, ${ville}` : ''}</Text>
        </View>
        {!!capacite && (
          <View style={s.recapRow}>
            <Text style={s.recapLabel}>Capacité</Text>
            <Text style={s.recapValue}>{capacite} personnes</Text>
          </View>
        )}
        {poster && (
          <View style={s.recapRow}>
            <Text style={s.recapLabel}>Affiche</Text>
            <Image source={{ uri: poster.uri }} style={[s.posterPreview, { height: 100 }]} />
          </View>
        )}

        <Text style={[s.recapLabel, { marginTop: 12 }]}>Types de billets</Text>
        {categories.map((c, i) => (
          <Text key={i} style={s.recapValue}>
            {c.nom} — {parseInt(c.prix || 0).toLocaleString()} FCFA · {c.capacite} places
          </Text>
        ))}

        {promoActif && promo.code && (
          <View style={[s.recapRow, { marginTop: 12 }]}>
            <Text style={s.recapLabel}>Code promo</Text>
            <Text style={s.recapValue}>
              {promo.code} — {promo.type === 'pourcentage' ? `${promo.valeur}%` : `${parseInt(promo.valeur || 0).toLocaleString()} FCFA`}
              {promo.limite ? ` (limite: ${promo.limite})` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Avertissement admin */}
      <View style={s.warningCard}>
        <Feather name="clock" size={18} color={colors.orange} />
        <View style={{ flex: 1 }}>
          <Text style={s.warningTitle}>Votre événement sera soumis à l'administrateur</Text>
          <Text style={s.warningDesc}>Une fois validé par l'admin, les billets seront disponibles à la vente.</Text>
        </View>
      </View>

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={() => gotoStep(2)}>
          <Text style={s.backBtnText}>← Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.submitBtn, submitting && s.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={s.submitBtnText}>Soumettre l'événement</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  )

  // --- Calendrier inline ---
  const renderCalendar = (target) => {
    const isDate = target === 'date'
    const expanded = isDate ? dateExpanded : dateFinExpanded
    const year = isDate ? browseYear : browseYearFin
    const month = isDate ? browseMonth : browseMonthFin
    const selected = isDate ? date : dateFin
    const setBrowseYearFn = isDate ? setBrowseYear : setBrowseYearFin
    const setBrowseMonthFn = isDate ? setBrowseMonth : setBrowseMonthFin
    const setDateFn = isDate ? setDate : setDateFin
    const setExpandedFn = isDate ? setDateExpanded : setDateFinExpanded

    if (!expanded) return null
    return (
      <View style={s.calendar}>
        <View style={s.calHeader}>
          <TouchableOpacity onPress={() => {
            if (month === 0) { setBrowseMonthFn(11); setBrowseYearFn(year - 1) }
            else setBrowseMonthFn(month - 1)
          }}>
            <Feather name="chevron-left" size={22} color={colors.accent} />
          </TouchableOpacity>
          <Text style={s.calHeaderText}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={() => {
            if (month === 11) { setBrowseMonthFn(0); setBrowseYearFn(year + 1) }
            else setBrowseMonthFn(month + 1)
          }}>
            <Feather name="chevron-right" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={s.calWeek}>
          {DAYS.map(d => <Text key={d} style={s.calWeekDay}>{d}</Text>)}
        </View>
        <View style={s.calGrid}>
          {[...Array(getFirstDay(year, month))].map((_, i) => (
            <View key={`e${i}`} style={s.calDay} />
          ))}
          {[...Array(getDaysInMonth(year, month))].map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
            const sel = selected === dateStr
            return (
              <TouchableOpacity
                key={day} style={[s.calDay, sel && s.calDaySelected]}
                onPress={() => { setDateFn(dateStr); setExpandedFn(false) }}
              >
                <Text style={[s.calDayText, sel && s.calDayTextSelected]}>{day}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  // --- Sélecteur d'heure inline ---
  const renderTimePicker = () => (
    <View style={s.timePicker}>
      <View style={s.timeCol}>
        <TouchableOpacity style={s.timeBtn} onPress={() => {
          const h = editHour === 23 ? 0 : editHour + 1
          setEditHour(h); setHeure(`${pad(h)}:${pad(editMinute)}`)
        }}>
          <Feather name="chevron-up" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={s.timeValue}>{pad(editHour)}</Text>
        <TouchableOpacity style={s.timeBtn} onPress={() => {
          const h = editHour === 0 ? 23 : editHour - 1
          setEditHour(h); setHeure(`${pad(h)}:${pad(editMinute)}`)
        }}>
          <Feather name="chevron-down" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>
      <Text style={s.timeSep}>:</Text>
      <View style={s.timeCol}>
        <TouchableOpacity style={s.timeBtn} onPress={() => {
          const m = editMinute >= 55 ? 0 : editMinute + 5
          setEditMinute(m); setHeure(`${pad(editHour)}:${pad(m)}`)
        }}>
          <Feather name="chevron-up" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={s.timeValue}>{pad(editMinute)}</Text>
        <TouchableOpacity style={s.timeBtn} onPress={() => {
          const m = editMinute <= 0 ? 55 : editMinute - 5
          setEditMinute(m); setHeure(`${pad(editHour)}:${pad(m)}`)
        }}>
          <Feather name="chevron-down" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={s.conteneur} keyboardShouldPersistTaps="handled">
          <Text style={s.retour} onPress={() => navigation.navigate('Dashboard')}>
            ← Retour
          </Text>

          <Text style={s.titre}>Créer un événement</Text>
          <Text style={s.sousTitre}>
            {`Étape ${step} sur 3 — ${STEPS[step - 1].label}`}
          </Text>

          <Stepper current={step} />

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Catégorie événement picker modal */}
      <Modal visible={catVisible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setCatVisible(false)}>
          <View style={s.picker}>
            <Text style={s.pickerTitle}>Catégorie d'événement</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, categorie === item && s.pickerItemActive]}
                  onPress={() => { setCategorie(item); setCatVisible(false) }}
                >
                  <Text style={[s.pickerItemText, categorie === item && s.pickerItemTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Type billet picker modal */}
      <Modal visible={billetCatIndex !== null} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setBilletCatIndex(null)}>
          <View style={s.picker}>
            <Text style={s.pickerTitle}>Type de billet</Text>
            <FlatList
              data={BILLET_CATEGORIES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, categories[billetCatIndex]?.nom === item && s.pickerItemActive]}
                  onPress={() => {
                    if (billetCatIndex !== null) updateCat(billetCatIndex, 'nom', item)
                    setBilletCatIndex(null)
                  }}
                >
                  <Text style={[s.pickerItemText, categories[billetCatIndex]?.nom === item && s.pickerItemTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Ville picker modal */}
      <Modal visible={villeVisible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setVilleVisible(false)}>
          <View style={s.picker}>
            <Text style={s.pickerTitle}>Ville</Text>
            <FlatList
              data={VILLES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, ville === item && s.pickerItemActive]}
                  onPress={() => { setVille(item); setVilleVisible(false) }}
                >
                  <Text style={[s.pickerItemText, ville === item && s.pickerItemTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

// --- Styles ---
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  conteneur: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  retour: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.accent, marginBottom: 16 },
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: colors.slate, marginBottom: 8 },
  sousTitre: { fontFamily: fonts.jakarta.regular, fontSize: 15, color: colors.mid, marginBottom: 8 },
  sectionTitle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.slate, marginBottom: 20, marginTop: 8 },
  label: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.slate, marginBottom: 6 },
  input: {
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, height: 56, justifyContent: 'center', marginBottom: 16,
  },
  inputError: { borderColor: colors.red },
  inputText: { fontFamily: fonts.outfit.regular, fontSize: 16, color: colors.slate },
  textarea: { height: 80, paddingTop: 16 },
  errorText: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.red, marginTop: -12, marginBottom: 12 },
  removeCat: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.red, textAlign: 'right', marginTop: -8 },
  posterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, justifyContent: 'center', marginBottom: 16,
  },
  posterBtnText: { fontFamily: fonts.outfit.regular, fontSize: 14, color: colors.muted },
  posterPreview: { width: '100%', height: 160, borderRadius: 12, resizeMode: 'cover' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  picker: { backgroundColor: colors.white, borderRadius: 20, padding: 20, maxHeight: 400 },
  pickerTitle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.slate, marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  pickerItemActive: { backgroundColor: colors.bg },
  pickerItemText: { fontFamily: fonts.outfit.regular, fontSize: 16, color: colors.slate },
  pickerItemTextActive: { fontFamily: fonts.outfit.semiBold, color: colors.accent },
  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperCircle: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.border, borderWidth: 2, borderColor: colors.border,
  },
  stepperCircleDone: { backgroundColor: colors.greenLight, borderColor: colors.green },
  stepperCircleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepperCircleText: { fontFamily: fonts.outfit.bold, fontSize: 13, color: colors.mid },
  stepperCircleTextActive: { color: colors.white },
  stepperLabel: { fontFamily: fonts.jakarta.regular, fontSize: 11, color: colors.mid, marginLeft: 4, maxWidth: 70 },
  stepperLabelActive: { fontFamily: fonts.jakarta.semiBold, color: colors.accent },
  stepperLabelDone: { color: colors.green },
  stepperLine: { width: 20, height: 2, backgroundColor: colors.border, marginHorizontal: 6 },
  stepperLineDone: { backgroundColor: colors.green },
  // Calendrier inline
  calendar: {
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 16,
  },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
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
  // Toggle promo
  promoToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  promoToggleTrack: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border,
    justifyContent: 'center', paddingHorizontal: 2, marginRight: 10,
  },
  promoToggleTrackActive: { backgroundColor: colors.accent },
  promoToggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white, alignSelf: 'flex-start' },
  promoToggleThumbActive: { alignSelf: 'flex-end' },
  promoToggleText: { fontFamily: fonts.outfit.regular, fontSize: 14, color: colors.slate },
  promoSection: {
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 16,
  },
  promoTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  promoTypeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  promoTypeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  promoTypeText: { fontFamily: fonts.outfit.semiBold, fontSize: 13, color: colors.slate },
  promoTypeTextActive: { color: colors.white },
  // Navigation entre étapes
  navRow: { flexDirection: 'row', gap: 12, marginTop: 28, alignItems: 'center' },
  backBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  backBtnText: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.accent },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: colors.accent,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.white },
  // Récapitulatif
  recapCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 16,
  },
  recapRow: { marginBottom: 14 },
  recapLabel: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.mid, marginBottom: 2 },
  recapValue: { fontFamily: fonts.outfit.semiBold, fontSize: 15, color: colors.slate },
  // Avertissement admin
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFF8E1', borderRadius: 14, borderWidth: 1, borderColor: '#FFE082',
    padding: 16, marginBottom: 16,
  },
  warningTitle: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: '#E65100', marginBottom: 4 },
  warningDesc: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: '#BF360C', lineHeight: 18 },
})
