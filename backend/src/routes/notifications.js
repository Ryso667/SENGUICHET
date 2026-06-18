// Routes API pour les notifications push et les tokens
// POST /api/notifications/register-token — enregistrer un token push
// POST /api/notifications/unregister-token — supprimer un token
// GET /api/notifications — lister les notifications de l'organisateur
// PUT /api/notifications/:id/lire — marquer comme lue
// PUT /api/notifications/lire-tout — tout marquer
// GET /api/notifications/non-lues — compteur (pour badge)
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const authMiddleware = require('../middleware/auth')

// Middleware : seul un organisateur connecté peut gérer ses notifications
router.use(authMiddleware(['ORGANISATEUR']))

// Enregistrer un token push
router.post('/register-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ erreur: 'Token requis' })

    const organisateurId = req.user.id
    // Éviter les doublons
    const [existant] = await db.query(
      'SELECT id FROM push_tokens WHERE token = ? AND organisateur_id = ?',
      [token, organisateurId]
    )
    if (existant.length === 0) {
      await db.query(
        'INSERT INTO push_tokens (organisateur_id, token) VALUES (?, ?)',
        [organisateurId, token]
      )
    }
    res.json({ succes: true })
  } catch (err) {
    console.error('Erreur register-token:', err.message)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Supprimer un token push (déconnexion)
router.post('/unregister-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ erreur: 'Token requis' })
    await db.query('DELETE FROM push_tokens WHERE token = ? AND organisateur_id = ?', [
      token, req.user.id,
    ])
    res.json({ succes: true })
  } catch (err) {
    console.error('Erreur unregister-token:', err.message)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Lister les notifications (les plus récentes d'abord)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.id, n.type, n.message, n.lue, n.created_at,
              e.titre as evenement_titre
       FROM notifications n
       LEFT JOIN evenement e ON n.evenement_id = e.id
       WHERE n.organisateur_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error('Erreur liste notifications:', err.message)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Marquer une notification comme lue
router.put('/:id/lire', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lue = TRUE WHERE id = ? AND organisateur_id = ?',
      [req.params.id, req.user.id]
    )
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Tout marquer comme lu
router.put('/lire-tout', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lue = TRUE WHERE organisateur_id = ?',
      [req.user.id]
    )
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Compter les notifications non lues (pour le badge)
router.get('/non-lues', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE organisateur_id = ? AND lue = FALSE',
      [req.user.id]
    )
    res.json({ total: rows[0].total })
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

module.exports = router
