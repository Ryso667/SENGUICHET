// Layout réutilisable pour toutes les pages acheteur
// Fond clair #F5F0EB appliqué ici
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/theme'
import GlassBottomNav from './GlassBottomNav'

export default function BuyerLayout({ children }) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {children}
      </SafeAreaView>
      <GlassBottomNav />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
})
