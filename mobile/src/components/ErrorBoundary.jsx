// Barrière de sécurité React : capture les erreurs de rendu pour éviter l'écran blanc
// Affiche un message de secours et un bouton de reconnexion

import { Component } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing } from '../constants/theme'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  render() {
    if (this.state.erreur) {
      return (
        <View style={styles.conteneur}>
          <Feather name="alert-triangle" size={48} color="#EF4444" />
          <Text style={styles.titre}>Oups ! Une erreur est survenue</Text>
          <Text style={styles.message}>{this.state.erreur.message}</Text>
          <TouchableOpacity
            style={styles.bouton}
            onPress={() => this.setState({ erreur: null })}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.boutonTexte}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: '#0D1B2A',
    gap: 12,
  },
  titre: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  boutonTexte: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },
})
