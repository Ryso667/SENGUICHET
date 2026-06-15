// Écran Notifications — placeholder pour la refonte UI
// Affiche un état vide quand aucune notification n'est présente
import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Feather name="bell" size={48} color="#9CA3AF" />
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Aucune notification pour le moment</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
})
