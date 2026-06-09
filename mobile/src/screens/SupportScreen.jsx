// Écran Support — version glass
// Fond : image Unsplash abstraite
// Contacts et FAQ en cartes glass
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing, borderRadius, glass, colors } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'

const FAQ = [
  { q: 'Comment acheter un ticket ?', r: 'Choisis un événement, sélectionne ta catégorie de ticket, paie via Wave ou Orange Money.' },
  { q: 'Puis-je être remboursé ?', r: 'Les remboursements sont gérés par l\'organisateur. Contacte le support si besoin.' },
  { q: 'Mon QR ne fonctionne pas', r: 'Assure-toi d\'avoir une bonne connexion. Le QR se régénère toutes les 30s.' },
]

export default function SupportScreen() {
  const [openIndex, setOpenIndex] = useState(null)

  const handleCall = () => { Linking.openURL('tel:+221771234567') }
  const handleWhatsApp = () => { Linking.openURL('https://wa.me/221771234567') }

  return (
    <View style={styles.container}>
      <BlurBackground category="Conference" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassContainer style={styles.headerCard} intensity={50}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.subtitle}>Comment pouvons-nous t'aider ?</Text>
        </GlassContainer>

        {/* Contacts */}
        <GlassContainer style={styles.contactsCard} intensity={40}>
          <View style={styles.contactRow}>
            <Feather name="mail" size={16} color={colors.accent} />
            <Text style={styles.contactText}>support@senguichet.sn</Text>
            <GlassChip label="Copier" onPress={() => {}} />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <Feather name="phone" size={16} color={colors.green} />
            <Text style={styles.contactText}>+221 77 123 45 67</Text>
            <GlassChip label="Appeler" onPress={handleCall} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
            <Feather name="message-circle" size={16} color="#25D366" />
            <Text style={styles.contactText}>WhatsApp</Text>
            <GlassChip label="Écrire" onPress={handleWhatsApp} />
          </TouchableOpacity>
        </GlassContainer>

        {/* FAQ */}
        <Text style={styles.faqTitle}>Questions fréquentes</Text>
        {FAQ.map((item, i) => {
          const open = openIndex === i
          return (
            <TouchableOpacity key={i} onPress={() => setOpenIndex(open ? null : i)} activeOpacity={0.7}>
              <GlassContainer style={styles.faqItem} intensity={40}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                </View>
                {open && <Text style={styles.faqAnswer}>{item.r}</Text>}
              </GlassContainer>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  headerCard: { padding: spacing.md, alignItems: 'center' },
  title: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 4 },
  contactsCard: { padding: spacing.md },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
  },
  contactText: {
    flex: 1, fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.text,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: glass.borderLight },
  faqTitle: {
    fontSize: 16, fontFamily: fonts.outfit.bold, color: colors.text, letterSpacing: -0.3, marginTop: 8,
  },
  faqItem: { padding: spacing.md },
  faqHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  faqQuestion: {
    flex: 1, fontSize: 13, fontFamily: fonts.jakarta.semiBold, color: colors.text, marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: 12, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18,
  },
})
