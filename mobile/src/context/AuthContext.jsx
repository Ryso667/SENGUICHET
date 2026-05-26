import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Contexte global d'authentification
// Permet de connaître le rôle connecté (acheteur/controleur) dans toute l'app
const AuthContext = createContext(null)

// Clés de stockage local
const STORAGE_KEY_NUMERO = '@senguichet_telephone'
const STORAGE_KEY_JWT = '@senguichet_jwt'

export function AuthProvider({ children }) {
  const [numeroTel, setNumeroTel] = useState(null)
  const [jwt, setJwt] = useState(null)
  const [role, setRole] = useState(null)
  const [chargement, setChargement] = useState(true)

  // Au démarrage, vérifie si une session existe dans AsyncStorage
  useEffect(() => {
    verifierSession()
  }, [])

  const verifierSession = async () => {
    try {
      const [telStocke, jwtStocke] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_NUMERO),
        AsyncStorage.getItem(STORAGE_KEY_JWT),
      ])
      if (telStocke) {
        setNumeroTel(telStocke)
        setRole('acheteur')
      }
      if (jwtStocke) {
        setJwt(jwtStocke)
        setRole('controleur')
      }
    } catch {
    } finally {
      setChargement(false)
    }
  }

  // Connecte un acheteur après validation OTP
  const connecterAcheteur = async (tel) => {
    await AsyncStorage.setItem(STORAGE_KEY_NUMERO, tel)
    setNumeroTel(tel)
    setRole('acheteur')
  }

  // Connecte un contrôleur après vérification du code d'accès
  const connecterControleur = async (token) => {
    await AsyncStorage.setItem(STORAGE_KEY_JWT, token)
    setJwt(token)
    setRole('controleur')
  }

  // Déconnexion : efface toutes les données stockées
  const deconnecter = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY_NUMERO),
      AsyncStorage.removeItem(STORAGE_KEY_JWT),
    ])
    setNumeroTel(null)
    setJwt(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        numeroTel,
        jwt,
        role,
        chargement,
        connecterAcheteur,
        connecterControleur,
        deconnecter,
        estConnecte: !!numeroTel || !!jwt,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé pour accéder au contexte auth depuis les écrans
export const useAuth = () => useContext(AuthContext)
