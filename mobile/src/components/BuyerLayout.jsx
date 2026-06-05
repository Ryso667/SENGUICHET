// Layout réutilisable pour toutes les pages acheteur — version glass
// Le fond est géré par chaque écran via BlurBackground
// Ce layout fournit uniquement le conteneur et la GlassBottomNav
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
  },
  safe: {
    flex: 1,
  },
})
