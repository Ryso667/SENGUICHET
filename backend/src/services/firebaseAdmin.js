// Service Firebase Admin : vérification des tokens ID côté serveur
const admin = require("firebase-admin");
require("dotenv").config();

let firebaseApp = null;

const initialiserFirebaseAdmin = () => {
  if (firebaseApp) return firebaseApp;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      const credentials = JSON.parse(serviceAccount);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } catch (err) {
      console.error("Erreur init Firebase Admin:", err.message);
      throw err;
    }
  } else {
    // Fallback : utiliser le projet ID par défaut (variables d'env GOOGLE_APPLICATION_CREDENTIALS ou metadata service)
    // En local, peut utiliser `firebase-admin` avec `FIREBASE_AUTH_EMULATOR_HOST`
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY non défini. Tentative avec credentials par défaut...");
    firebaseApp = admin.initializeApp({
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "senguichet",
    });
  }

  return firebaseApp;
};

// Vérifie un token ID Firebase et retourne les infos utilisateur décodées
// Utile pour les connexions sociales (Google, Apple)
const verifierTokenFirebase = async (idToken) => {
  const app = initialiserFirebaseAdmin();
  try {
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
      nom: decoded.name || decoded.email?.split("@")[0] || "Acheteur",
      photo_url: decoded.picture || null,
      auth_provider: decoded.firebase?.sign_in_provider || "unknown",
    };
  } catch (err) {
    console.error("Erreur vérification token Firebase:", err.message);
    throw new Error("Token Firebase invalide ou expiré");
  }
};

module.exports = { initialiserFirebaseAdmin, verifierTokenFirebase };
