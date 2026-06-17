// Écran Mes favoris ❤️
// Liste les événements favoris stockés localement dans AsyncStorage
// Chaque item : titre, date, image, bouton cœur pour retirer
// Tap sur un item -> navigue vers EventDetail
import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { spacing, borderRadius, fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { getAllFavoris, basculerFavori } from '../utils/favorisStorage'
import { formaterDateLisible } from '../utils/dateUtils'

export default function MesFavorisScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [favoris, setFavoris] = useState([])

  useFocusEffect(
    useCallback(() => {
      chargerFavoris()
    }, [])
  )

  const chargerFavoris = async () => {
    const data = await getAllFavoris()
    setFavoris(Object.values(data).reverse()) // plus récent d'abord
  }

  const retirerFavori = async (eventId) => {
    await basculerFavori(eventId)
    chargerFavoris()
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        {item.affiche_url ? (
          <Image source={{ uri: item.affiche_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.cardEmoji}>{item.emoji || '\uD83C\uDFAB'}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDate}>
          {item.date ? formaterDateLisible(item.date) : ''}
        </Text>
        {item.location && (
          <View style={styles.cardLocation}>
            <Feather name="map-pin" size={12} color={colors.textTertiary} />
            <Text style={styles.cardLocationText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.heartBtn}
        onPress={() => retirerFavori(item.id)}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="heart" size={22} color={colors.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {favoris.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-outline" size={56} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptySub}>Ajoute des événements en cœur pour les retrouver ici</Text>
        </View>
      ) : (
        <FlatList
          data={favoris}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { marginRight: spacing.md },
  cardImage: { width: 56, height: 56, borderRadius: borderRadius.md, resizeMode: 'cover' },
  cardImagePlaceholder: { width: 56, height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 24 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontFamily: fonts.outfit.bold, color: colors.text },
  cardDate: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.textSecondary },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocationText: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textTertiary, flex: 1 },
  heartBtn: { padding: 4, marginLeft: spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.text, marginTop: spacing.md },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl },
})
