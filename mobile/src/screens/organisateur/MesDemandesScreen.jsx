// Mes demandes — liste + création + détail (calqué sur l'app web)
// Design glass (Apple Invites) — modale création avec upload Cloudinary
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert, Animated, ActivityIndicator, Keyboard, Modal, FlatList } from 'react-native'
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, fonts, textShadow } from '../../constants/theme'
import { listerMesDemandes, soumettreDemandeEvenement } from '../../services/eventService'
import { uploadImage } from '../../services/cloudinaryService'
import * as ImagePicker from 'expo-image-picker'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'
import Skeleton from '../../components/Skeleton'

const STATUT_CONFIG = {
  soumis: { label: 'Soumis', color: '#F97316', bg: 'rgba(249,115,22,0.2)' },
  en_analyse: { label: 'En analyse', color: '#F59E0B', bg: 'rgba(245,158,11,0.2)' },
  approuve: { label: 'Approuvé', color: '#00E5A0', bg: 'rgba(0,229,160,0.2)' },
  refuse: { label: 'Refusé', color: '#FF4D6D', bg: 'rgba(255,77,109,0.2)' },
}

const TYPE_LABELS = {
  CREATION: 'Création',
  MODIFICATION: 'Modification',
  SUPPRESSION: 'Suppression',
}

const DEMANDE_TYPES = [
  { value: 'CREATION', label: 'Créer un nouvel événement' },
  { value: 'MODIFICATION', label: 'Modifier un événement' },
  { value: 'SUPPRESSION', label: 'Supprimer un événement' },
]

const CATEGORIES = [
  'Concert', 'Festival', 'Théâtre', 'Sport', 'Conférence',
  'Atelier', 'Exposition', 'Club / Soirée', 'Gala', 'Autres / Divers',
]

const VILLES = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Touba', 'Kaolack', 'Autre',
]

export default function MesDemandesScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [viewingDemande, setViewingDemande] = useState(null)
  const [sending, setSending] = useState(false)
  const [demandeSent, setDemandeSent] = useState(false)
  const [error, setError] = useState('')

  // Form state — calqué sur le web
  const [typeAction, setTypeAction] = useState('CREATION')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [lieu, setLieu] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [heure, setHeure] = useState('')
  const [heureExpanded, setHeureExpanded] = useState(false)
  const [editHour, setEditHour] = useState(12)
  const [editMinute, setEditMinute] = useState(0)
  const [capacite, setCapacite] = useState('')
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState([{ nom: '', places: '', prix: '' }])
  const [uploading, setUploading] = useState(false)
  const [afficheUrl, setAfficheUrl] = useState(null)
  const [affichePreview, setAffichePreview] = useState(null)
  const [categorie, setCategorie] = useState('')
  const [ville, setVille] = useState('')
  const [catVisible, setCatVisible] = useState(false)
  const [villeVisible, setVilleVisible] = useState(false)
  const [dateExpanded, setDateExpanded] = useState(false)
  const [dateFinExpanded, setDateFinExpanded] = useState(false)
  const [browseYear, setBrowseYear] = useState(new Date().getFullYear())
  const [browseMonth, setBrowseMonth] = useState(new Date().getMonth())
  const [browseYearFin, setBrowseYearFin] = useState(new Date().getFullYear())
  const [browseMonthFin, setBrowseMonthFin] = useState(new Date().getMonth())
  const [kbPadding, setKbPadding] = useState(0)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbPadding(e.endCoordinates.height))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbPadding(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  const fadeAnim = useRef(new Animated.Value(0)).current

  const charger = useCallback(async () => {
    try {
      const data = await listerMesDemandes()
      setDemandes(data || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    charger()
    const unsub = navigation.addListener('focus', charger)
    return unsub
  }, [charger, navigation])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [charger])

  const openNewDemande = () => {
    setModalMode('create')
    setViewingDemande(null)
    // Si la dernière demande a été envoyée avec succès, réinitialiser le formulaire
    // Sinon, conserver les champs saisis (reprise après erreur ou fermeture accidentelle)
    if (demandeSent) {
      setTypeAction('CREATION')
      setTitre('')
      setDescription('')
      setLieu('')
      setDateDebut('')
      setDateFin('')
      setHeure('')
      setHeureExpanded(false)
      setEditHour(12)
      setEditMinute(0)
      setCapacite('')
      setMessage('')
      setCategories([{ nom: '', places: '', prix: '' }])
      setUploading(false)
      setAfficheUrl(null)
      setAffichePreview(null)
      setCategorie('')
      setVille('')
      setDateExpanded(false)
      setDateFinExpanded(false)
      setDemandeSent(false)
    }
    setError('')
    setModalVisible(true)
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }

  const openDetail = (d) => {
    setModalMode('detail')
    setViewingDemande(d)
    setModalVisible(true)
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }

  const closeModal = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setModalVisible(false)
    })
  }

  const addCategory = () => setCategories([...categories, { nom: '', places: '', prix: '' }])
  const removeCategory = (i) => { if (categories.length > 1) setCategories(categories.filter((_, idx) => idx !== i)) }
  const updateCategory = (i, field, val) => {
    setCategories(categories.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true })
      if (!result.canceled && result.assets?.[0]) {
        setAffichePreview(result.assets[0].uri)
        setUploading(true)
        try {
          const url = await uploadImage(result.assets[0])
          setAfficheUrl(url)
        } catch {
          Alert.alert('Erreur', "Échec de l'upload de l'affiche")
          setAffichePreview(null)
        }
        setUploading(false)
      }
    } catch {
      Alert.alert('Erreur', 'Module image picker non disponible')
    }
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le message.')
      return
    }
    setSending(true)
    setError('')
    try {
      const payload = { type_action: typeAction, description: message }
      if (typeAction === 'CREATION') {
        if (!titre.trim() || !lieu.trim() || !dateDebut || !capacite || !categorie) {
          Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.')
          setSending(false)
          return
        }
        payload.titre = titre
        payload.description = `${description}\n\n${message}`
        payload.categorie = categorie
        payload.lieu = ville ? `${lieu}, ${ville}` : lieu
        payload.ville = ville || ''
        payload.heure = heure || null
        payload.date_debut = dateDebut
        payload.date_fin = dateFin || null
        payload.capacite = parseInt(capacite) || 0
        if (afficheUrl) payload.affiche_url = afficheUrl
        payload.categories_tickets = categories
          .filter(c => c.nom.trim() && c.places && c.prix)
          .map(c => ({ nom: c.nom.trim(), places: parseInt(c.places) || 0, prix: parseInt(c.prix) || 0 }))
      } else {
        payload.titre = titre
      }
      await soumettreDemandeEvenement(payload)
      setDemandeSent(true)
      charger()
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  // Assistance — constantes et helpers pour le calendrier
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay()
  const pad = (n) => n.toString().padStart(2, '0')

  // Calendrier interactif pour le choix des dates
  const renderCalendar = (target) => {
    const isDate = target === 'date'
    const expanded = isDate ? dateExpanded : dateFinExpanded
    const year = isDate ? browseYear : browseYearFin
    const month = isDate ? browseMonth : browseMonthFin
    const selected = isDate ? dateDebut : dateFin
    const setBrowseYearFn = isDate ? setBrowseYear : setBrowseYearFin
    const setBrowseMonthFn = isDate ? setBrowseMonth : setBrowseMonthFin
    const setDateFn = isDate ? setDateDebut : setDateFin
    const setExpandedFn = isDate ? setDateExpanded : setDateFinExpanded

    if (!expanded) return null
    return (
      <GlassContainer blurType="light" style={f.calendar} intensity={30}>
        <View style={f.calHeader}>
          <TouchableOpacity onPress={() => {
            if (month === 0) { setBrowseMonthFn(11); setBrowseYearFn(year - 1) }
            else setBrowseMonthFn(month - 1)
          }}>
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={f.calHeaderText}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={() => {
            if (month === 11) { setBrowseMonthFn(0); setBrowseYearFn(year + 1) }
            else setBrowseMonthFn(month + 1)
          }}>
            <Feather name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={f.calWeek}>
          {DAYS.map(d => <Text key={d} style={f.calWeekDay}>{d}</Text>)}
        </View>
        <View style={f.calGrid}>
          {[...Array(getFirstDay(year, month))].map((_, i) => (
            <View key={`e${i}`} style={f.calDay} />
          ))}
          {[...Array(getDaysInMonth(year, month))].map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
            const sel = selected === dateStr
            return (
              <TouchableOpacity
                key={day} style={[f.calDay, sel && f.calDaySelected]}
                onPress={() => { setDateFn(dateStr); setExpandedFn(false) }}
              >
                <Text style={[f.calDayText, sel && f.calDayTextSelected]}>{day}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </GlassContainer>
    )
  }

  // Sélecteur d'heure inline (calqué sur CreerEvenementScreen)
  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return (
      <GlassContainer blurType="light" style={f.timePicker} intensity={30}>
        <View style={f.timeRow}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={f.timeLabel}>Heure</Text>
            <View style={f.timeCol}>
              <TouchableOpacity onPress={() => setEditHour(editHour === 23 ? 0 : editHour + 1)}>
                <Feather name="chevron-up" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              <Text style={f.timeValue}>{editHour.toString().padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => setEditHour(editHour === 0 ? 23 : editHour - 1)}>
                <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={{ fontSize: 24, color: '#fff', fontFamily: fonts.outfit.bold, alignSelf: 'center', paddingBottom: 8 }}>:</Text>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={f.timeLabel}>Minutes</Text>
            <View style={f.timeCol}>
              <TouchableOpacity onPress={() => setEditMinute(editMinute === 55 ? 0 : editMinute + 5)}>
                <Feather name="chevron-up" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              <Text style={f.timeValue}>{editMinute.toString().padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => setEditMinute(editMinute === 0 ? 55 : editMinute - 5)}>
                <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity style={f.timeConfirmBtn} onPress={() => {
          setHeure(`${editHour.toString().padStart(2, '0')}:${editMinute.toString().padStart(2, '0')}`)
          setHeureExpanded(false)
        }}>
          <Text style={f.timeConfirmText}>Confirmer l'heure</Text>
        </TouchableOpacity>
      </GlassContainer>
    )
  }

  const renderTypeSelect = () => (
    <View style={f.selectRow}>
      {DEMANDE_TYPES.map(t => (
        <TouchableOpacity key={t.value} style={[f.selectOpt, typeAction === t.value && f.selectOptActive]} onPress={() => setTypeAction(t.value)}>
          <Text style={[f.selectOptText, typeAction === t.value && f.selectOptTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const renderLabel = (text, required) => (
    <Text style={f.label}>{text}{required ? <Text style={{ color: '#FF4D6D' }}> *</Text> : null}</Text>
  )

  const renderInput = (placeholder, value, onChange, extra) => {
    const { style: extraStyle, ...rest } = extra || {}
    return (
      <TextInput style={[f.input, extraStyle]} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.3)" value={value} onChangeText={onChange} selectionColor="rgba(255,255,255,0.5)" {...rest} />
    )
  }

  return (
    <View style={s.container}>
      <OrganisateurLayout />
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C8FF', '#fff']} tintColor="#fff" progressBackgroundColor="rgba(255,255,255,0.15)" />}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Mes demandes</Text>
            <TouchableOpacity style={s.newBtn} onPress={openNewDemande}>
              <LinearGradient colors={['#00C8FF', '#0077FF']} style={s.newBtnGrad}>
                <MaterialCommunityIcons name="calendar-plus" size={16} color="#fff" />
                <Text style={s.newBtnText}>Nouvelle demande</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {!loading && demandes.length > 0 && (
            <Text style={s.refreshHint}>↓ Tirer vers le bas pour actualiser</Text>
          )}

          {loading ? (
            <Skeleton type="card" count={3} />
          ) : demandes.length === 0 ? (
            <GlassContainer blurType="light" style={s.emptyState}>
              <MaterialCommunityIcons name="inbox-outline" size={56} color="rgba(255,255,255,0.2)" />
              <Text style={s.emptyTitle}>Aucune demande</Text>
              <Text style={s.emptySub}>Vous n'avez encore fait aucune demande.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={openNewDemande}>
                <MaterialCommunityIcons name="calendar-plus" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Créer une demande</Text>
              </TouchableOpacity>
            </GlassContainer>
          ) : (
            <View style={s.list}>
              {demandes.map((d, i) => {
                const cfg = STATUT_CONFIG[d.statut] || STATUT_CONFIG.soumis
                return (
                  <GlassContainer blurType="light" key={d.id} style={s.card}>
                    <View style={s.cardTop}>
                      <View style={s.cardInfo}>
                        <View style={s.cardTitleRow}>
                          <Text style={s.cardType}>{TYPE_LABELS[d.type_action] || d.type_action}</Text>
                          <View style={[s.cardBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[s.cardBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                        </View>
                        <Text style={s.cardDate}>
                          {new Date(d.date_soumission).toLocaleDateString('fr-FR')}
                          {d.titre ? ` · ${d.titre}` : ''}
                        </Text>
                        {d.commentaire_admin && d.statut !== 'soumis' && d.statut !== 'en_analyse' && (
                          <Text style={[s.cardComment, { color: d.statut === 'approuve' ? '#00E5A0' : '#FF4D6D' }]}>
                            {d.commentaire_admin}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity style={s.detailBtn} onPress={() => openDetail(d)}>
                        <Text style={s.detailBtnText}>Détails</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassContainer>
                )
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* MODAL */}
      {modalVisible && (
        <Animated.View style={[s.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[s.modalContent, { transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {modalMode === 'detail' && viewingDemande ? (
                /* === MODE DÉTAIL === */
                <>
                  <View style={s.modalHeader}>
                    <Text style={s.modalTitle}>Détail de la demande</Text>
                    <TouchableOpacity onPress={closeModal}><MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
                  </View>

                  <View style={s.detailBadgeRow}>
                    <View style={[s.cardBadge, { backgroundColor: (STATUT_CONFIG[viewingDemande.statut] || STATUT_CONFIG.soumis).bg }]}>
                      <Text style={[s.cardBadgeText, { color: (STATUT_CONFIG[viewingDemande.statut] || STATUT_CONFIG.soumis).color }]}>
                        {(STATUT_CONFIG[viewingDemande.statut] || STATUT_CONFIG.soumis).label}
                      </Text>
                    </View>
                    <View style={s.detailTypeBadge}>
                      <Text style={s.detailTypeText}>{TYPE_LABELS[viewingDemande.type_action] || viewingDemande.type_action}</Text>
                    </View>
                  </View>

                  <Text style={s.detailSub}>
                    Soumise le {new Date(viewingDemande.date_soumission).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {viewingDemande.date_traitement && ` · Traitée le ${new Date(viewingDemande.date_traitement).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                  </Text>

                  {viewingDemande.affiche_url && (
                    <View style={s.detailImageWrap}>
                      <Image source={{ uri: viewingDemande.affiche_url }} style={s.detailImage} resizeMode="cover" />
                      <View style={s.detailImageOverlay} />
                    </View>
                  )}

                  {viewingDemande.titre ? <DetailField label="Événement" value={viewingDemande.titre} /> : null}
                  {viewingDemande.description ? <DetailField label="Description" value={viewingDemande.description} /> : null}
                  {viewingDemande.lieu ? <DetailField label="Lieu" value={viewingDemande.lieu} /> : null}

                  {viewingDemande.date_debut && (
                    <View style={s.detailTwoCol}>
                      <DetailField label="Date début" value={new Date(viewingDemande.date_debut).toLocaleDateString('fr-FR')} />
                      {viewingDemande.date_fin && <DetailField label="Date fin" value={new Date(viewingDemande.date_fin).toLocaleDateString('fr-FR')} />}
                    </View>
                  )}

                  {viewingDemande.capacite > 0 ? <DetailField label="Capacité" value={`${viewingDemande.capacite} places`} /> : null}

                  {viewingDemande.commentaire_admin && viewingDemande.statut !== 'soumis' && viewingDemande.statut !== 'en_analyse' && (
                    <View style={[s.commentBox, { backgroundColor: viewingDemande.statut === 'approuve' ? 'rgba(0,229,160,0.08)' : 'rgba(255,77,109,0.08)', borderColor: viewingDemande.statut === 'approuve' ? 'rgba(0,229,160,0.2)' : 'rgba(255,77,109,0.2)' }]}>
                      <Text style={[s.commentLabel, { color: viewingDemande.statut === 'approuve' ? '#00E5A0' : '#FF4D6D' }]}>
                        {viewingDemande.statut === 'approuve' ? 'Commentaire' : 'Motif du refus'}
                      </Text>
                      <Text style={s.commentValue}>{viewingDemande.commentaire_admin}</Text>
                    </View>
                  )}
                </>
              ) : demandeSent ? (
                /* === ÉTAT SUCCÈS === */
                <View style={s.successWrap}>
                  <MaterialCommunityIcons name="check-circle-outline" size={48} color="#00E5A0" />
                  <Text style={s.successTitle}>Demande soumise</Text>
                  <Text style={s.successSub}>Votre demande a été transmise à l'équipe SenGuichet. Vous recevrez une réponse par email.</Text>
                  <TouchableOpacity style={s.successBtn} onPress={closeModal}>
                    <Text style={s.successBtnText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* === FORMULAIRE CRÉATION === */
                <>
                  <View style={s.modalHeader}>
                    <Text style={s.modalTitle}>
                      {typeAction === 'CREATION' ? 'Nouvel événement' : typeAction === 'MODIFICATION' ? 'Modifier' : 'Supprimer'}
                    </Text>
                    <TouchableOpacity onPress={closeModal}><MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
                  </View>

                  {error ? (
                    <GlassContainer blurType="light" style={s.errorBox}>
                      <Text style={s.errorText}>{error}</Text>
                    </GlassContainer>
                  ) : null}

                  {/* Type de demande */}
                  {renderLabel('Type de demande', true)}
                  {renderTypeSelect()}

                  {typeAction === 'CREATION' && (
                    <>
                      {renderLabel("Titre de l'événement", true)}
                      {renderInput('Ex: Concert de Dakar', titre, setTitre)}

                      {/* Catégorie */}
                      {renderLabel('Catégorie', true)}
                      <TouchableOpacity style={f.pickerBtn} onPress={() => setCatVisible(true)}>
                        <Text style={[f.pickerBtnText, !categorie && { color: 'rgba(255,255,255,0.3)' }]}>
                          {categorie || 'Sélectionner une catégorie'}
                        </Text>
                        <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>

                      {renderLabel('Description', true)}
                      {renderInput('Décrivez votre événement...', description, setDescription, { multiline: true, style: { height: 80, textAlignVertical: 'top' } })}

                      <View style={f.twoCol}>
                        <View style={{ flex: 1 }}>
                          {renderLabel('Lieu', true)}
                          {renderInput('Monument Renaissance...', lieu, setLieu)}
                        </View>
                        <View style={{ flex: 1 }}>
                          {renderLabel('Ville', true)}
                          <TouchableOpacity style={f.pickerBtn} onPress={() => setVilleVisible(true)}>
                            <Text style={[f.pickerBtnText, !ville && { color: 'rgba(255,255,255,0.3)' }]}>
                              {ville || 'Ville'}
                            </Text>
                            <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Date début */}
                      {renderLabel('Date début', true)}
                      <TouchableOpacity style={f.pickerBtn} onPress={() => setDateExpanded(!dateExpanded)}>
                        <Text style={[f.pickerBtnText, !dateDebut && { color: 'rgba(255,255,255,0.3)' }]}>
                          {dateDebut || 'Sélectionner une date'}
                        </Text>
                        <Feather name={dateExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                      {renderCalendar('date')}

                      {/* Date fin */}
                      {renderLabel('Date fin')}
                      <TouchableOpacity style={f.pickerBtn} onPress={() => setDateFinExpanded(!dateFinExpanded)}>
                        <Text style={[f.pickerBtnText, !dateFin && { color: 'rgba(255,255,255,0.3)' }]}>
                          {dateFin || 'Même jour (par défaut)'}
                        </Text>
                        <Feather name={dateFinExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                      {renderCalendar('dateFin')}

                      {/* Horaire */}
                      {renderLabel('Horaire')}
                      <TouchableOpacity style={f.pickerBtn} onPress={() => setHeureExpanded(!heureExpanded)}>
                        <Text style={[f.pickerBtnText, !heure && { color: 'rgba(255,255,255,0.3)' }]}>
                          {heure || 'Sélectionner l\'heure (optionnel)'}
                        </Text>
                        <Feather name={heureExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                      {heureExpanded && renderTimePicker()}

                      {renderLabel('Capacité', true)}
                      {renderInput('Ex: 1000', capacite, setCapacite, { keyboardType: 'numeric' })}

                      {/* Affiche */}
                      {renderLabel('Affiche de l\'événement')}
                      <TouchableOpacity style={f.uploadZone} onPress={pickImage} disabled={uploading}>
                        {uploading ? (
                          <ActivityIndicator color="#fff" />
                        ) : affichePreview ? (
                          <Image source={{ uri: affichePreview }} style={f.affichePreview} />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="image-plus-outline" size={28} color="rgba(255,255,255,0.3)" />
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Ajouter une affiche</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* Catégories tickets */}
                      <View style={f.catHeader}>
                        <Text style={f.label}>Catégories de tickets <Text style={{ color: '#FF4D6D' }}>*</Text></Text>
                        <TouchableOpacity style={f.addCatBtn} onPress={addCategory}>
                          <MaterialCommunityIcons name="plus" size={14} color="#00C8FF" />
                        </TouchableOpacity>
                      </View>
                      {categories.map((cat, i) => (
                        <View key={i} style={f.catRow}>
                          {renderInput('Nom', cat.nom, (v) => updateCategory(i, 'nom', v), { style: { flex: 1, marginRight: 4 } })}
                          {renderInput('Places', cat.places, (v) => updateCategory(i, 'places', v), { style: { flex: 1, marginHorizontal: 4 }, keyboardType: 'numeric' })}
                          {renderInput('Prix', cat.prix, (v) => updateCategory(i, 'prix', v), { style: { flex: 1, marginLeft: 4 }, keyboardType: 'numeric' })}
                          {categories.length > 1 && (
                            <TouchableOpacity onPress={() => removeCategory(i)} style={{ padding: 4 }}>
                              <MaterialCommunityIcons name="close-circle" size={18} color="#FF4D6D" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </>
                  )}

                  {typeAction !== 'CREATION' && (
                    <>
                      {renderLabel('Titre / Événement concerné')}
                      {renderInput('Nom de l\'événement concerné', titre, setTitre)}
                    </>
                  )}

                  {renderLabel('Message détaillé', true)}
                  {renderInput(
                    typeAction === 'CREATION' ? 'Informations complémentaires...' : 'Décrivez les changements souhaités...',
                    message, setMessage, { multiline: true, style: { height: 80, textAlignVertical: 'top' } }
                  )}

                  <TouchableOpacity style={f.submitBtn} onPress={handleSubmit} disabled={sending}>
                    <LinearGradient colors={['#00C8FF', '#0077FF']} style={f.submitGrad}>
                      {sending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={f.submitText}>
                          <MaterialCommunityIcons name="send" size={14} color="#fff" /> Envoyer la demande
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              <View style={{ height: 20 }} />
              {kbPadding > 0 && <View style={{ height: kbPadding }} />}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}

      {/* Modale catégorie */}
      <Modal visible={catVisible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setCatVisible(false)}>
          <GlassContainer blurType="dark" style={s.picker} intensity={50}>
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
          </GlassContainer>
        </TouchableOpacity>
      </Modal>

      {/* Modale ville */}
      <Modal visible={villeVisible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setVilleVisible(false)}>
          <GlassContainer blurType="dark" style={s.picker} intensity={50}>
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
          </GlassContainer>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const DetailField = ({ label, value }) => (
  <View style={f.detailField}>
    <Text style={f.detailLabel}>{label}</Text>
    <Text style={f.detailValue}>{value}</Text>
  </View>
)

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  refreshHint: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: spacing.sm },
  newBtn: { borderRadius: 12, overflow: 'hidden' },
  newBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  newBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff' },

  emptyState: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', ...textShadow },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, backgroundColor: 'rgba(0,200,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  emptyBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },

  list: { gap: spacing.sm },
  card: { padding: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardType: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  cardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardBadgeText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  cardDate: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  cardComment: { fontSize: 11, fontFamily: fonts.jakarta.regular, marginTop: 2, fontStyle: 'italic' },
  detailBtn: {
    borderWidth: 1, borderColor: 'rgba(0,200,255,0.3)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, marginLeft: spacing.sm,
  },
  detailBtnText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },

  /* Modal */
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    backgroundColor: '#152232', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, maxHeight: '85%',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },

  /* Détail */
  detailBadgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  detailTypeBadge: { backgroundColor: 'rgba(0,200,255,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  detailTypeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
  detailSub: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.md },
  detailImageWrap: { height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: spacing.md },
  detailImage: { width: '100%', height: '100%' },
  detailImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  detailTwoCol: { flexDirection: 'row', gap: spacing.md },
  commentBox: { padding: spacing.md, borderRadius: 12, borderWidth: 1, marginTop: spacing.sm },
  commentLabel: { fontSize: 10, fontFamily: fonts.outfit.semiBold, marginBottom: 4 },
  commentValue: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)' },

  /* Succès */
  successWrap: { alignItems: 'center', paddingVertical: 30, gap: spacing.sm },
  successTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  successSub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  successBtn: { marginTop: spacing.md, backgroundColor: 'rgba(0,200,255,0.15)', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  successBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },

  /* Erreur */
  errorBox: { padding: spacing.sm, marginBottom: spacing.md },
  errorText: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: '#FF4D6D' },

  /* Picker modals */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  picker: { padding: 20, maxHeight: 400 },
  pickerTitle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: '#fff', marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  pickerItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  pickerItemText: { fontFamily: fonts.outfit.regular, fontSize: 16, color: '#fff' },
  pickerItemTextActive: { fontFamily: fonts.outfit.semiBold, color: '#fff' },
})

const f = StyleSheet.create({
  label: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.6)', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 14, height: 44, fontSize: 14, fontFamily: fonts.jakarta.regular, color: '#fff',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.sm,
  },
  selectRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  selectOpt: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(0,200,255,0.3)',
  },
  selectOptActive: { backgroundColor: '#00C8FF', borderColor: '#00C8FF' },
  selectOptText: { fontSize: 12, fontFamily: fonts.outfit.regular, color: 'rgba(255,255,255,0.6)' },
  selectOptTextActive: { color: '#fff' },
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  uploadZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, paddingVertical: 30, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  addCatBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,200,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  submitBtn: { borderRadius: 12, overflow: 'hidden', marginTop: spacing.md },
  submitGrad: { paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 14, fontFamily: fonts.outfit.bold, color: '#fff' },
  detailField: { marginBottom: spacing.sm },
  detailLabel: { fontSize: 10, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  detailValue: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: '#fff' },

  /* Picker bouton */
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 14, height: 44,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.sm,
  },
  pickerBtnText: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: '#fff', flex: 1 },

  /* Affiche preview */
  affichePreview: { width: '100%', height: 140, borderRadius: 10, resizeMode: 'cover' },

  /* Calendrier */
  calendar: { padding: 12, marginBottom: spacing.sm },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calHeaderText: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  calWeek: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  calWeekDay: { width: 32, textAlign: 'center', fontSize: 11, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDaySelected: { backgroundColor: '#00C8FF', borderRadius: 20 },
  calDayText: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)' },
  calDayTextSelected: { color: '#fff', fontFamily: fonts.outfit.semiBold },

  /* Time picker */
  timePicker: { padding: 12, marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timeLabel: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  timeCol: { alignItems: 'center', gap: 4 },
  timeValue: { fontSize: 28, fontFamily: fonts.outfit.bold, color: '#fff', paddingVertical: 4 },
  timeConfirmBtn: {
    backgroundColor: 'rgba(0,200,255,0.15)', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  timeConfirmText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
})
