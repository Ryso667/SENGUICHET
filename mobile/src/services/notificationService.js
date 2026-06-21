// Service de notifications push côté mobile
// Gère l'enregistrement du token Expo, la récupération des notifications,
// et le compteur de non-lues
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { appelAPI } from './apiService'
import * as Securite from '../utils/secureStorage'

// Configure le comportement des notifications reçues (son, alert, badge)
export async function configurerNotifications() {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
    }),
  })

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }
}

// Demande la permission et récupère le token Expo push
export async function obtenirTokenPush() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return null

    const tokenData = await Notifications.getExpoPushTokenAsync()
    return tokenData.data
  } catch (err) {
    console.warn('Push token non disponible:', err.message)
    return null
  }
}

// Enregistre le token push sur le backend
// Utilise le endpoint correspondant au rôle (acheteur ou organisateur)
export async function enregistrerToken(token, role = 'organisateur') {
  try {
    const endpoint = role === 'acheteur' ? '/acheteur/push/register' : '/notifications/register-token'
    await appelAPI(endpoint, {
      method: 'POST',
      body: role === 'acheteur' ? { pushToken: token } : { token },
    })
    await Securite.SET('push_token', token)
  } catch (err) {
    console.error('Erreur enregistrement token push:', err.message)
  }
}

// Supprime le token push sur le backend (déconnexion)
export async function supprimerToken(role = 'organisateur') {
  try {
    const token = await Securite.GET('push_token')
    if (token) {
      const endpoint = role === 'acheteur' ? '/acheteur/push/unregister' : '/notifications/unregister-token'
      await appelAPI(endpoint, {
        method: 'POST',
        body: role === 'acheteur' ? { pushToken: token } : { token },
      })
      await Securite.SUPPRIMER('push_token')
    }
  } catch (err) {
    console.error('Erreur suppression token push:', err.message)
  }
}

// Récupère la liste des notifications
export async function fetchNotifications() {
  const data = await appelAPI('/notifications')
  return data
}

// Récupère le compteur de non-lues
export async function fetchCompteurNonLues() {
  const data = await appelAPI('/notifications/non-lues')
  return data.total || 0
}

// Marque une notification comme lue
export async function marquerLue(id) {
  await appelAPI(`/notifications/${id}/lire`, { method: 'PUT' })
}

// Marque tout comme lu
export async function marquerToutLu() {
  await appelAPI('/notifications/lire-tout', { method: 'PUT' })
}

// Ajoute un listener pour les notifications reçues quand l'app est ouverte
export function ajouterListenerNotification(callback) {
  const subscription = Notifications.addNotificationReceivedListener(callback)
  return subscription
}
