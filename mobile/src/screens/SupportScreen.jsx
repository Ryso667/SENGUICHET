// Écran Support
// Contacts pour contacter l'assistance
import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing, glass } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'

export default function SupportScreen() {
  const { colors, mode, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()

  const handleWhatsApp = () => { Linking.openURL('https://wa.me/xxx') }
  const handleEmail = () => { Linking.openURL('mailto:support@senguichet.com') }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'}
      >
        {/* Header */}
        <GlassContainer style={styles.headerCard} intensity={50}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.subtitle}>Comment pouvons-nous t'aider ?</Text>
        </GlassContainer>

        {/* Contacts */}
        <GlassContainer style={styles.contactsCard} intensity={40}>
          <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
            <Feather name="mail" size={16} color={colors.accent} />
            <Text style={styles.contactText}>support@senguichet.com</Text>
            <GlassChip label="Écrire" onPress={handleEmail} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
            <Feather name="message-circle" size={16} color="#25D366" />
            <Text style={styles.contactText}>WhatsApp — xxx</Text>
            <GlassChip label="Écrire" onPress={handleWhatsApp} />
          </TouchableOpacity>
        </GlassContainer>
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
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
})
