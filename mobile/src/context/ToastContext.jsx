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
  const handleDismiss = useCallback(() => {
    affichageEnCoursRef.current = false
    setCurrentToast(null)

    // Toast suivant dans la file
    if (fileAttenteRef.current.length > 0) {
      const suivant = fileAttenteRef.current.shift()
      affichageEnCoursRef.current = true
      setCurrentToast(suivant)
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
export const useToast = () => useContext(ToastContext)
