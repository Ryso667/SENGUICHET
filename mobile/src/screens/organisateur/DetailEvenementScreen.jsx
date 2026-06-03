// Détail d'un événement - mode lecture seule
// Informations + catégories tickets + transactions + boutons demande
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import StatusBadge from '../../components/StatusBadge'
import ProgressBar from '../../components/ProgressBar'

const MOCK_EVENT = {
  id: '1',
  nom: 'Festival Jazz St-Louis',
  statut: 'ACTIF',
  lieu: 'Saint-Louis, Sénégal',
  date: '15 Juin 2026',
  capacite: 500,
  remplis: 342,
  categories: [
    { nom: 'Standard', prix: 15000, vendus: 200, total: 250 },
    { nom: 'VIP', prix: 35000, vendus: 100, total: 150 },
    { nom: 'Gold', prix: 50000, vendus: 42, total: 100 },
  ],
  transactions: [
    { id: 't1', nom: 'Ousmane S.', categorie: 'VIP', montant: 35000, date: '28 Mai 2026' },
    { id: 't2', nom: 'Fatou D.', categorie: 'Standard', montant: 15000, date: '27 Mai 2026' },
    { id: 't3', nom: 'Mamadou N.', categorie: 'Gold', montant: 50000, date: '26 Mai 2026' },
    { id: 't4', nom: 'Aïcha B.', categorie: 'Standard', montant: 15000, date: '25 Mai 2026' },
  ],
}

const TYPES_DEMANDE = [
  'Modification de date',
  'Modification de lieu',
  'Modification de prix',
  'Autre modification',
  'Annulation',
]

export default function DetailEvenementScreen({ route, navigation }) {
  const { eventId } = route.params || {}
  const [showModal, setShowModal] = useState(false)
  const [typeDemande, setTypeDemande] = useState('')
  const [details, setDetails] = useState('')
  const [typeAnnonce, setTypeAnnonce] = useState('modification')

  const evenement = MOCK_EVENT

  function ouvrirDemande(type) {
    setTypeAnnonce(type)
    setTypeDemande('')
    setDetails('')
    setShowModal(true)
  }

  function soumettre() {
    if (!details.trim()) {
      Alert.alert('Champ requis', 'Veuillez décrire votre demande.')
      return
    }
    Alert.alert(
      'Demande envoyée',
      'Notre équipe vous contacte sous 48h.'
    )
    setShowModal(false)
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.titre}>{evenement.nom}</Text>
          <StatusBadge status={evenement.statut} />
        </View>

        <View style={styles.infoGrid}>
          <InfoItem icon="map-pin" label="Lieu" value={evenement.lieu} />
          <InfoItem icon="calendar" label="Date" value={evenement.date} />
          <InfoItem icon="users" label="Capacité" value={`${evenement.capacite} places`} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories de tickets</Text>
          {evenement.categories.map((cat, i) => (
            <View key={i} style={styles.catCard}>
              <View style={styles.catHeader}>
                <Text style={styles.catNom}>{cat.nom}</Text>
                <Text style={styles.catPrix}>{cat.prix.toLocaleString()} FCFA</Text>
              </View>
              <ProgressBar value={cat.vendus} max={cat.total} />
              <Text style={styles.catCount}>
                {cat.vendus} / {cat.total} vendus
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          {evenement.transactions.map((t) => (
            <View key={t.id} style={styles.transaction}>
              <View style={styles.transLeft}>
                <Text style={styles.transNom}>{t.nom}</Text>
                <Text style={styles.transMeta}>{t.categorie} · {t.date}</Text>
              </View>
              <Text style={styles.transMontant}>{t.montant.toLocaleString()} FCFA</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.modifierBtn]}
          onPress={() => ouvrirDemande('modification')}
        >
          <Text style={styles.modifierBtnText}>Demander une modification</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.annulerBtn]}
          onPress={() => ouvrirDemande('annulation')}
        >
          <Text style={styles.annulerBtnText}>Demander l'annulation</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {typeAnnonce === 'annulation' ? "Demande d'annulation" : 'Demande de modification'}
            </Text>

            <Text style={styles.inputLabel}>Type de demande</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              <View style={styles.typeRow}>
                {TYPES_DEMANDE.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, typeDemande === t && styles.typeChipActive]}
                    onPress={() => setTypeDemande(t)}
                  >
                    <Text style={[styles.typeChipText, typeDemande === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Détails de la demande</Text>
            <TextInput
              style={styles.textarea}
              multiline
              numberOfLines={4}
              placeholder="Décrivez votre demande..."
              placeholderTextColor="#6B7280"
              value={details}
              onChangeText={setDetails}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={soumettre}>
                <LinearGradient
                  colors={['#00C8FF', '#0077FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnGradient}
                >
                  <Text style={styles.submitBtnText}>Envoyer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={infoStyles.item}>
      <Feather name={icon} size={14} color="#00C8FF" />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  )
}

const infoStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    width: 60,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    flex: 1,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
  },
  titre: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  infoGrid: {
    backgroundColor: '#152232',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.15)',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  catCard: {
    backgroundColor: '#152232',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.15)',
    padding: 14,
    marginBottom: 8,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catNom: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  catPrix: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#00C8FF',
  },
  catCount: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    marginTop: 4,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152232',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  transLeft: {
    flex: 1,
  },
  transNom: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  transMeta: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    marginTop: 2,
  },
  transMontant: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#00C8FF',
  },
  bottomBtns: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0D1B2A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,200,255,0.15)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modifierBtn: {
    borderWidth: 1,
    borderColor: '#00C8FF',
  },
  modifierBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#00C8FF',
  },
  annulerBtn: {
    borderWidth: 1,
    borderColor: '#FF4D6D',
  },
  annulerBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF4D6D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#152232',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#6B7280',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A0B4C8',
    marginBottom: 8,
  },
  typeScroll: {
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.3)',
  },
  typeChipActive: {
    backgroundColor: '#00C8FF',
    borderColor: '#00C8FF',
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#A0B4C8',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  textarea: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.15)',
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A0B4C8',
  },
  submitBtn: {
    flex: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
})
