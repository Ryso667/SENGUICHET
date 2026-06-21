// Utilitaires pour les notifications push (Expo)
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Demander la permission et récupérer le token Expo push
export async function getPushToken () {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null
  const token = await Notifications.getExpoPushTokenAsync()
  return token.data
}

// Configurer le handler de notification en premier plan
export function configurePushHandler () {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}
