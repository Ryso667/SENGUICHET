import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { colors, fonts, spacing, borderRadius } from '../constants/theme'

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

export default function DatePickerModal({ visible, onClose, onSelect }) {
  const today = new Date()
  const [annee, setAnnee] = useState(today.getFullYear())
  const [mois, setMois] = useState(today.getMonth())

  const premierJour = new Date(annee, mois, 1).getDay()
  const joursDansMois = new Date(annee, mois + 1, 0).getDate()

  const jours = []
  for (let i = 0; i < premierJour; i++) jours.push(null)
  for (let d = 1; d <= joursDansMois; d++) jours.push(d)

  const handleSelect = (jour) => {
    const jj = String(jour).padStart(2, '0')
    const mm = String(mois + 1).padStart(2, '0')
    onSelect(`${jj}/${mm}/${annee}`)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => { if (mois === 0) { setMois(11); setAnnee(a => a - 1) } else setMois(m => m - 1) }}>
              <Text style={s.nav}>◀</Text>
            </TouchableOpacity>
            <Text style={s.moisAnnee}>{MOIS[mois]} {annee}</Text>
            <TouchableOpacity onPress={() => { if (mois === 11) { setMois(0); setAnnee(a => a + 1) } else setMois(m => m + 1) }}>
              <Text style={s.nav}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={s.grille}>
            {JOURS.map(j => <Text key={j} style={s.jourLabel}>{j}</Text>)}
            {jours.map((j, i) => (
              <View key={i} style={s.cell}>
                {j && (
                  <TouchableOpacity style={s.jourBtn} onPress={() => handleSelect(j)}>
                    <Text style={s.jourText}>{j}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.fermer} onPress={onClose}>
            <Text style={s.fermerText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  nav: { fontSize: 20, color: colors.accent, padding: spacing.sm },
  moisAnnee: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.slate },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  jourLabel: { width: '14.28%', textAlign: 'center', fontSize: 11, fontFamily: fonts.jakarta.semiBold, color: colors.mid, paddingVertical: spacing.xs },
  cell: { width: '14.28%', alignItems: 'center', padding: 2 },
  jourBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentLight },
  jourText: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  fermer: { alignItems: 'center', marginTop: spacing.md },
  fermerText: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.accent },
})
