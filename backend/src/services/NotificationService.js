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
