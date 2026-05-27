// Layout réutilisable pour toutes les pages acheteur
// Inclut le fond, le décor gradienté, le contenu et la BottomNav fixe en bas
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import BottomNav from './BottomNav'
import { colors } from '../constants/theme'

export default function BuyerLayout({ children }) {
  return (
    <View style={styles.container}>
      {/* Lueur violette subtile en haut pour l'ambiance premium */}
      <LinearGradient
        colors={['rgba(99,102,241,0.07)', 'rgba(236,72,153,0.04)', 'transparent']}
        locations={[0, 0.4, 1]}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <View style={styles.content}>
        {children}
      </View>
      <BottomNav />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  content: {
    flex: 1,
  },
})
