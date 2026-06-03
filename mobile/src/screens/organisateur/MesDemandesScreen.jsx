// Mes demandes - liste des demandes avec modal nouvelle demande
// Données mockées pour l'instant
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import DemandeCard from '../../components/DemandeCard'

const MOCK_DEMANDES = [
  { id: '1', type: 'Modification de date', evenement: 'Festival Jazz St-Louis', date: '2026-05-28', statut: 'EN_ATTENTE' },
  { id: '2', type: 'Demande de nouvel événement', evenement: 'Concert N\'Dakaru', date: '2026-05-25', statut: 'EN_COURS' },
  { id: '3', type: 'Modification de prix', evenement: 'Expo Art Dakar', date: '2026-05-20', statut: 'ACCEPTEE' },
  { id: '4', type: 'Annulation', evenement: 'Match Gala Foot', date: '2026-05-15', statut: 'REJETEE' },
]

const TYPES_DEMANDE = [
  'Nouvel événement',
  'Modification de date',
  'Modification de lieu',
  'Modification de prix',
  'Autre modification',
  'Annulation',
]

const MOCK_EVENTS_LIST = [
  'Festival Jazz St-Louis',
  "Concert N'Dakaru",
  'Expo Art Dakar',
  'Séminaire Tech Sénégal',
]

export default function MesDemandesScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false)
  const [typeDemande, setTypeDemande] = useState('')
  const [evenementConcerne, setEvenementConcerne] = useState('')
  const [details, setDetails] = useState('')

  function soumettre() {
    if (!details.trim() || !typeDemande) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.')
      return
    }
    Alert.alert('Demande envoyée', 'Notre équipe vous contacte sous 48h.')
    setShowModal(false)
    setTypeDemande('')
    setEvenementConcerne('')
    setDetails('')
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createBtn}
        activeOpacity={0.85}
        onPress={() => setShowModal(true)}
      >
        <LinearGradient
          colors={['#00C8FF', '#0077FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createBtnGradient}
        >
          <Text style={styles.createBtnText}>+ Nouvelle demande</Text>
        </LinearGradient>
      </TouchableOpacity>

      <FlatList
        data={MOCK_DEMANDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DemandeCard
            demande={item}
            onPress={() => {}}
            onDetail={() => {
              Alert.alert(
                item.type,
                `Événement : ${item.evenement}\nStatut : ${item.statut}\nDate : ${new Date(item.date).toLocaleDateString('fr-FR')}`
              )
            }}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nouvelle demande</Text>

            <Text style={styles.inputLabel}>Type de demande</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {TYPES_DEMANDE.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, typeDemande === t && styles.chipActive]}
                    onPress={() => setTypeDemande(t)}
                  >
                    <Text style={[styles.chipText, typeDemande === t && styles.chipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Événement concerné</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {MOCK_EVENTS_LIST.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.chip, evenementConcerne === e && styles.chipActive]}
                    onPress={() => setEvenementConcerne(e)}
                  >
                    <Text style={[styles.chipText, evenementConcerne === e && styles.chipTextActive]}>
                      {e}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Détails</Text>
            <TextInput
              style={styles.textarea}
              multiline
              numberOfLines={4}
              placeholder="Décrivez votre demande en détail..."
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  createBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#00C8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
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
    maxHeight: '85%',
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
  chipScroll: {
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.3)',
  },
  chipActive: {
    backgroundColor: '#00C8FF',
    borderColor: '#00C8FF',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#A0B4C8',
  },
  chipTextActive: {
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
