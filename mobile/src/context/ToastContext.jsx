// Contexte global de notification (toasts)
// Fournit des methodes pour afficher des notifications temporaires
// avec file d'attente si plusieurs toasts sont déclenchés simultanément
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import Toast from '../components/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [currentToast, setCurrentToast] = useState(null)
  const fileAttenteRef = useRef([])
  const affichageEnCoursRef = useRef(false)

  // Affiche un toast avec un message et un type (success/error/info)
  // Si un toast est déjà visible, le nouveau est mis en file d'attente
  const showToast = useCallback((message, type = 'info') => {
    if (affichageEnCoursRef.current) {
      fileAttenteRef.current.push({ message, type })
    } else {
      affichageEnCoursRef.current = true
      setCurrentToast({ message, type })
    }
  }, [])

  const success = useCallback((msg) => showToast(msg, 'success'), [showToast])
  const error   = useCallback((msg) => showToast(msg, 'error'), [showToast])
  const info    = useCallback((msg) => showToast(msg, 'info'), [showToast])

  // Appelé après la fin de l'animation de disparition
  // Traite la file en premier pour éviter les races conditions
  const handleDismiss = useCallback(() => {
    const suivant = fileAttenteRef.current.shift()
    if (suivant) {
      setCurrentToast(suivant)
    } else {
      affichageEnCoursRef.current = false
      setCurrentToast(null)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {currentToast && (
        <Toast
          message={currentToast.message}
          type={currentToast.type}
          onDismiss={handleDismiss}
        />
      )}
    </ToastContext.Provider>
  )
}

// Hook utilisable depuis n'importe quel écran pour afficher un toast
export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider')
  return ctx
}
