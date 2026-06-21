// Service d'envoi de notifications (push Expo + base de données)
// Envoie une notification push à tous les tokens d'un organisateur
// et persiste la notification dans la table notifications
const db = require('../config/db')

// Envoie une notification push Expo et l'enregistre en base
// @param {number} organisateurId - ID de l'organisateur destinataire
// @param {object} data - { type, message, evenementId }
exports.envoyerNotification = async (organisateurId, data) => {
  try {
    // Persister en base
    const [result] = await db.query(
      `INSERT INTO notifications (organisateur_id, evenement_id, type, message)
       VALUES (?, ?, ?, ?)`,
      [organisateurId, data.evenementId || null, data.type, data.message]
    )
    const notificationId = result.insertId

    // Import dynamique car expo-server-sdk est un module ESM
    const { Expo } = await import('expo-server-sdk')
    const expo = new Expo()

    // Récupérer les tokens push de l'organisateur
    const [tokens] = await db.query(
      'SELECT token FROM push_tokens WHERE organisateur_id = ?',
      [organisateurId]
    )

    // Envoyer via Expo Push API
    const messages = []
    for (const row of tokens) {
      if (!Expo.isExpoPushToken(row.token)) continue
      messages.push({
        to: row.token,
        sound: 'default',
        title: 'Nouvelle vente',
        body: data.message,
        data: { evenementId: data.evenementId, notificationId },
      })
    }

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages)
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk)
      }
    }

    return notificationId
  } catch (err) {
    console.error('Erreur NotificationService:', err.message)
  }
}

// Envoyer une notification push à un acheteur via Expo Push API directe
// @param {string} token - Expo push token de l'acheteur
// @param {string} titre - Titre de la notification
// @param {string} message - Corps de la notification
// @param {object} [data] - Données supplémentaires transmises à l'app
// @returns {Promise<boolean>} Succès ou échec de l'envoi
exports.envoyerPushAcheteur = async (token, titre, message, data = {}) => {
  try {
    if (!token || typeof token !== 'string' || !token.startsWith('ExponentPushToken')) return false
    const notification = {
      to: token,
      sound: 'default',
      title: titre,
      body: message,
      data,
      _displayInForeground: true,
    }
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    })
    const result = await response.json()
    return result.data?.status === 'ok' || false
  } catch (err) {
    console.error('Erreur envoi push acheteur:', err.message)
    return false
  }
}
