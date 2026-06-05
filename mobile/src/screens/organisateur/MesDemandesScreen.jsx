// Mes demandes — liste + création + détail (calqué sur l'app web)
// Design glass (Apple Invites) — modale création avec upload Cloudinary
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert, Animated, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, fonts, textShadow } from '../../constants/theme'
import { listerMesDemandes, soumettreDemandeEvenement } from '../../services/eventService'
import { uploadImage } from '../../services/cloudinaryService'
import BlurBackground from '../../components/BlurBackground'
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
  const [capacite, setCapacite] = useState('')
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState([{ nom: '', places: '', prix: '' }])
  const [uploading, setUploading] = useState(false)
  const [afficheUrl, setAfficheUrl] = useState(null)
  const [affichePreview, setAffichePreview] = useState(null)

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
    setTypeAction('CREATION')
    setTitre('')
    setDescription('')
    setLieu('')
    setDateDebut('')
    setDateFin('')
    setCapacite('')
    setMessage('')
    setCategories([{ nom: '', places: '', prix: '' }])
    setUploading(false)
    setAfficheUrl(null)
    setAffichePreview(null)
    setDemandeSent(false)
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
      const { launchImageLibraryAsync, MediaTypeOptions } = await import('expo-image-picker')
      const result = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.7 })
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
        if (!titre.trim() || !lieu.trim() || !dateDebut || !capacite) {
          Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.')
          setSending(false)
          return
        }
        payload.titre = titre
        payload.description = `${description}\n\n${message}`
        payload.lieu = lieu
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

  const renderInput = (placeholder, value, onChange, extra) => (
    <TextInput style={[f.input, extra?.style]} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.3)" value={value} onChangeText={onChange} {...extra} />
  )

  return (
    <View style={s.container}>
      <BlurBackground category="Conference" />
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor="#fff" />}
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

          {loading ? (
            <Skeleton type="card" count={3} />
          ) : demandes.length === 0 ? (
            <GlassContainer style={s.emptyState}>
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
                  <GlassContainer key={d.id} style={s.card}>
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
                      <MaterialCommunityIcons name="image-outline" size={40} color="rgba(255,255,255,0.15)" />
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
                    <GlassContainer style={s.errorBox}>
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
                      {renderLabel('Description', true)}
                      {renderInput('Décrivez votre événement...', description, setDescription, { multiline: true, style: { height: 80, textAlignVertical: 'top' } })}
                      {renderLabel('Lieu', true)}
                      {renderInput('Ex: Place de l\'Indépendance', lieu, setLieu)}
                      <View style={f.twoCol}>
                        <View style={{ flex: 1 }}>
                          {renderLabel('Date début', true)}
                          {renderInput('AAAA-MM-JJ', dateDebut, setDateDebut)}
                        </View>
                        <View style={{ flex: 1 }}>
                          {renderLabel('Date fin')}
                          {renderInput('AAAA-MM-JJ (optionnel)', dateFin, setDateFin)}
                        </View>
                      </View>
                      {renderLabel('Capacité', true)}
                      {renderInput('Ex: 500', capacite, setCapacite, { keyboardType: 'numeric' })}

                      {/* Affiche */}
                      {renderLabel('Affiche de l\'événement')}
                      <TouchableOpacity style={f.uploadZone} onPress={pickImage} disabled={uploading}>
                        {uploading ? (
                          <ActivityIndicator color="#fff" />
                        ) : affichePreview ? (
                          <View style={{ width: '100%', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="image-check" size={32} color="#00E5A0" />
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Affiche ajoutée</Text>
                          </View>
                        ) : (
                          <>
                            <MaterialCommunityIcons name="image-plus-outline" size={32} color="rgba(255,255,255,0.3)" />
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'center' }}>Appuyez pour ajouter une affiche</Text>
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
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
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
  detailImageWrap: { height: 120, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
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
})
