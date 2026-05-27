// Sélecteur d'horaire avec créneaux prédéfinis + saisie libre
// Design premium avec scroll de créneaux fréquents
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { colors, fonts, spacing, borderRadius } from '../constants/theme'

const CRENEAUX = [
  '08h00', '09h00', '10h00', '11h00', '12h00', '13h00', '14h00',
  '15h00', '16h00', '17h00', '18h00', '19h00', '19h30',
  '20h00', '20h30', '21h00', '21h30', '22h00', '23h00',
]

export default function TimePickerModal({ visible, onClose, onSelect }) {
  const [custom, setCustom] = useState('')

  const handleSelect = (time) => {
    onSelect(time)
    onClose()
  }

  const handleCustom = () => {
    if (custom.trim()) {
      onSelect(custom.trim())
      onClose()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
        <TouchableOpacity style={s.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={s.modal}>
          <Text style={s.title}>Choisir l'horaire</Text>
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={s.grid}>
              {CRENEAUX.map(t => (
                <TouchableOpacity key={t} style={s.creneau} onPress={() => handleSelect(t)}>
                  <Text style={s.creneauText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={s.customRow}>
            <TextInput
              style={s.customInput}
              value={custom}
              onChangeText={setCustom}
              placeholder="Autre horaire"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity style={s.customBtn} onPress={handleCustom}>
              <Text style={s.customBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modal: {
    backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg, maxHeight: '60%',
  },
  title: {
    fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.slate,
    textAlign: 'center', marginBottom: spacing.md,
  },
  scroll: { maxHeight: 260 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  creneau: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: borderRadius.lg,
    backgroundColor: '#f1f5f9',
  },
  creneauText: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  customRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  customInput: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: borderRadius.lg, paddingHorizontal: 16,
    height: 48, fontSize: 15, fontFamily: fonts.outfit.regular, color: colors.slate,
  },
  customBtn: {
    backgroundColor: '#6366F1', borderRadius: borderRadius.lg, paddingHorizontal: 24,
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  customBtnText: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: '#fff' },
})
