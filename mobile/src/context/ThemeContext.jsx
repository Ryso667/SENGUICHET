// Contexte de thème (clair/sombre) avec persistance AsyncStorage et détection automatique
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightColors, darkColors } from '../constants/theme'

const STORAGE_KEY = '@senguichet_theme'
const ThemeContext = createContext({ colors: lightColors, isDark: false, mode: 'system', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState('system') // 'light' | 'dark' | 'system'
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setMode(v)
      setSaved(true)
    })
  }, [])

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark')
  const colors = isDark ? darkColors : lightColors

  const setTheme = useCallback(async (newMode) => {
    if (newMode !== 'light' && newMode !== 'dark' && newMode !== 'system') return
    setMode(newMode)
    await AsyncStorage.setItem(STORAGE_KEY, newMode)
  }, [])

  if (!saved) return null

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
