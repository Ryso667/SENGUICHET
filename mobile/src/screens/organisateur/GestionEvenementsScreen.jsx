// Mes événements - liste avec FlatList + bouton demande + progress bars
// Données mockées pour l'instant
import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import EventCard from '../../components/EventCard'

const MOCK_EVENTS = [
  { id: '1', nom: 'Festival Jazz St-Louis', statut: 'ACTIF', lieu: 'Saint-Louis', date: '2026-06-15', capacite: 500, remplis: 342 },
  { id: '2', nom: 'Concert N\'Dakaru', statut: 'ACTIF', lieu: 'Dakar', date: '2026-07-20', capacite: 1000, remplis: 678 },
  { id: '3', nom: 'Expo Art Dakar', statut: 'EN_ATTENTE', lieu: 'Dakar', date: '2026-08-10', capacite: 300, remplis: 0 },
  { id: '4', nom: 'Séminaire Tech Sénégal', statut: 'TERMINE', lieu: 'Diamniadio', date: '2026-04-05', capacite: 200, remplis: 200 },
  { id: '5', nom: 'Match Gala Foot', statut: 'ANNULE', lieu: 'Thiès', date: '2026-03-01', capacite: 2000, remplis: 450 },
]

export default function GestionEvenementsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('MesDemandes')}
      >
        <LinearGradient
          colors={['#00C8FF', '#0077FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createBtnGradient}
        >
          <Text style={styles.createBtnText}>+ Demander un nouvel événement</Text>
        </LinearGradient>
      </TouchableOpacity>

      <FlatList
        data={MOCK_EVENTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate('DetailEvenement', { eventId: item.id })}
            onDetail={() => navigation.navigate('DetailEvenement', { eventId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  createBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#00C8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
})
