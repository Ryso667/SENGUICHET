// En-tête de section avec titre optionnel et action
// Props : title (string), actionLabel (string, optionnel), onAction (fn, optionnel)
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.spacer} />}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  action: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#00C8FF',
  },
  spacer: {
    flex: 1,
  },
})
