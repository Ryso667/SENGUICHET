// Écran de reçu d'achat groupé — affiche tous les billets d'une même transaction
// Les billets sont groupés par catégorie avec QR code + navigation vers le détail
// Utilise useEffect pour charger les données depuis GET /api/billets/recu/:reference/data

import { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { formaterDateLisible } from '../utils/dateUtils'
import { fetcherRecuAchat } from '../services/billetService'

const C = {
  headerBg: '#10B981',
  pageBg: '#0F1A0F',
  cream: '#F9F6EE',
  beige: '#F0EAD6',
  white: '#FFFFFF',
  dark: '#111827',
  gold: '#F59E0B',
}

export default function RecuAchatScreen({ route, navigation }) {
  const { reference, billetsAchetes } = route.params || {}
  const { colors, mode, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()

  const [recu, setRecu] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  // Charge les données depuis l'API ou depuis la réponse d'achat directe
  useEffect(() => {
    chargerRecu()
  }, [reference])

  async function chargerRecu() {
    setChargement(true)
    setErreur(null)
    try {
      // Si les billets sont déjà dans la réponse d'achat, on les utilise directement
      if (billetsAchetes && billetsAchetes.length > 0) {
        setRecu({
          reference: reference || 'PENDING',
          evenement: {
            titre: billetsAchetes[0].evenement || '',
          },
          tickets: billetsAchetes,
          nbTickets: billetsAchetes.length,
          montantTotal: billetsAchetes.reduce((s, b) => s + Number(b.prix || 0), 0),
        })
        setChargement(false)
        return
      }
      // Sinon, appel API
      const data = await fetcherRecuAchat(reference)
      setRecu(data)
    } catch (err) {
      setErreur(err.message || 'Impossible de charger le reçu')
    } finally {
      setChargement(false)
    }
  }

  if (chargement) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.headerBg} />
          <Text style={styles.loadingText}>Chargement du reçu...</Text>
        </View>
      </View>
    )
  }

  if (erreur || !recu) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{erreur || 'Reçu introuvable'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={chargerRecu}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const tickets = recu.tickets || []
  const montantTotal = recu.montantTotal || tickets.reduce((s, t) => s + Number(t.prixPaye || t.prix || 0), 0)
  const nbTickets = recu.nbTickets || tickets.length
  const eventInfo = recu.evenement || {}
  const eventDate = eventInfo.dateDebut ? formaterDateLisible(eventInfo.dateDebut) : ''

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color={C.white} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'}
      >
        {/* Carte du reçu */}
        <View style={styles.recuCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.orbe1} />
            <View style={styles.orbe2} />
            <Text style={styles.headerTitle}>SENGUICHET</Text>
            <Text style={styles.headerSub}>Achat confirmé</Text>
            <View style={styles.goldLine} />
            <Text style={styles.refText}>RÉFÉRENCE · {reference}</Text>
          </View>

          {/* Perforation haute */}
          <View style={styles.perfTop} />

          {/* Infos événement */}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{(eventInfo.titre || '').toUpperCase()}</Text>
            {eventDate ? <Text style={styles.eventDetail}>{eventDate}</Text> : null}
            {eventInfo.lieu ? <Text style={styles.eventDetail}>{eventInfo.lieu}</Text> : null}
          </View>

          {/* Compteur de billets */}
          <Text style={styles.ticketCount}>{nbTickets} billet{nbTickets > 1 ? 's' : ''}</Text>

          {/* Liste des billets */}
          {tickets.map((t, idx) => (
            <TouchableOpacity
              key={t.uuid || idx}
              style={styles.ticketRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Ticket', { ticket: {
                uuid: t.uuid,
                numero: t.numero || t.numero,
                prix: t.prixPaye || t.prix,
                evenement: eventInfo.titre,
                categorie: t.categorie || '',
                dateAchat: t.dateCreation || t.dateAchat,
                qrPayload: t.qrPayload,
                eventId: t.eventId || t.event_id,
                eventNom: eventInfo.titre,
                eventDate: eventInfo.dateDebut,
                eventLieu: eventInfo.lieu,
                telephone: t.telephone,
                statut: (t.statut || 'ACTIF').toLowerCase(),
              }})}
            >
              <View style={styles.qrWrapper}>
                {t.qrPayload ? (
                  <QRCode
                    value={t.qrPayload}
                    size={80}
                    backgroundColor="transparent"
                    color={C.dark}
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <MaterialCommunityIcons name="qrcode" size={40} color={colors.textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketRef}>{t.numero}</Text>
                <Text style={styles.ticketCat}>{(t.categorie || '').toUpperCase()}</Text>
                <Text style={styles.ticketPrix}>{Number(t.prixPaye || t.prix || 0).toLocaleString('fr-FR')} FCFA</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}

          {/* Perforation basse */}
          <View style={styles.perfBottom} />

          {/* Total */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>{montantTotal.toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <Text style={styles.legal}>Entrée unique et non transférable</Text>
            <Text style={styles.watermark}>SENGUICHET</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.headerBg,
  },
  retryText: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 13,
    color: C.white,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  recuCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.cream,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    backgroundColor: C.headerBg,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  orbe1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(110,231,183,0.25)',
  },
  orbe2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  headerTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    letterSpacing: 3,
    color: C.white,
  },
  headerSub: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  goldLine: {
    height: 1,
    backgroundColor: C.gold,
    opacity: 0.6,
    marginVertical: 12,
    width: '60%',
  },
  refText: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
  },
  perfTop: {
    height: 20,
    backgroundColor: C.cream,
    borderTopWidth: 2,
    borderTopColor: 'rgba(16,185,129,0.15)',
    borderStyle: 'dashed',
  },
  eventInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.white,
    marginHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  eventTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: C.dark,
    textAlign: 'center',
  },
  eventDetail: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  ticketCount: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 14,
    color: C.dark,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  qrWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfo: {
    flex: 1,
    gap: 3,
  },
  ticketRef: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 13,
    color: C.dark,
    letterSpacing: 0.5,
  },
  ticketCat: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 10,
    color: C.headerBg,
    letterSpacing: 2,
  },
  ticketPrix: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 15,
    color: C.headerBg,
  },
  perfBottom: {
    height: 20,
    backgroundColor: C.beige,
    borderTopWidth: 2,
    borderTopColor: 'rgba(16,185,129,0.15)',
    borderStyle: 'dashed',
  },
  footer: {
    backgroundColor: C.beige,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 1,
  },
  totalAmount: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: C.dark,
  },
  legal: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 10,
    color: 'rgba(16,185,129,0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  watermark: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 8,
    color: 'rgba(16,185,129,0.2)',
    letterSpacing: 2,
    alignSelf: 'flex-end',
  },
})
