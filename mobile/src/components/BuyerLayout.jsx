// Layout réutilisable pour toutes les pages acheteur
// Fond sombre #1A1A1E appliqué ici (remplace BlurBackground géré par chaque écran)
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
    backgroundColor: '#1A1A1E',
  },
  safe: {
    flex: 1,
  },
})
