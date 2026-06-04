// Stockage persistant des codes OTP sur disque (fichier JSON)
// Survit aux redémarrages du serveur contrairement au Map mémoire
// Nettoyage : suppression automatique des codes expirés (TTL : 5 min)
const fs = require('fs')
const path = require('path')

const TTL_MS = 5 * 60 * 1000
const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const FILE_PATH = path.join(DATA_DIR, 'otps.json')

// Charge les OTP depuis le fichier JSON au démarrage
const CHARGER_OTPS = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(FILE_PATH)) return {}
    const raw = fs.readFileSync(FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// Sauvegarde tous les OTP dans le fichier JSON
const SAUVEGARDER = (donnees) => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(FILE_PATH, JSON.stringify(donnees, null, 2), 'utf-8')
  } catch (err) {
    console.error('Erreur sauvegarde OTP:', err.message)
  }
}

// Nettoie les codes expirés (lazy cleanup)
const NETTOYER = (donnees) => {
  const maintenant = Date.now()
  let modifie = false
  for (const email in donnees) {
    if (donnees[email].createdAt + TTL_MS < maintenant) {
      delete donnees[email]
      modifie = true
    }
  }
  if (modifie) SAUVEGARDER(donnees)
  return donnees
}

// Stocke un code OTP pour un email (remplace l'ancien s'il existe)
const STOCKER_CODE = (email, code) => {
  const donnees = CHARGER_OTPS()
  const emailKey = email.toLowerCase()
  donnees[emailKey] = { code, createdAt: Date.now() }
  SAUVEGARDER(donnees)
}

// Vérifie et consomme un code OTP (supprime après vérification réussie)
// Retourne true si le code est valide et non expiré
const VERIFIER_CODE = (email, code) => {
  const donnees = NETTOYER(CHARGER_OTPS())
  const emailKey = email.toLowerCase()
  const entry = donnees[emailKey]
  if (!entry) return false
  if (entry.code !== code) return false
  delete donnees[emailKey]
  SAUVEGARDER(donnees)
  return true
}

// Supprime un code existant pour un email
const SUPPRIMER_CODE = (email) => {
  const donnees = CHARGER_OTPS()
  delete donnees[email.toLowerCase()]
  SAUVEGARDER(donnees)
}

module.exports = { STOCKER_CODE, VERIFIER_CODE, SUPPRIMER_CODE }
