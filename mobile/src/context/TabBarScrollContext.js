// Contexte partagé pour le scroll des tab screens
// Permet à FloatingTabBar de détecter le scroll et de se compacter
import { createContext, useContext, useRef, useMemo } from 'react'
import { Animated } from 'react-native'

const TabBarScrollContext = createContext(null)

export function TabBarScrollProvider({ children }) {
  const scrollY = useRef(new Animated.Value(0)).current

  const resetScroll = () => {
    Animated.timing(scrollY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const value = useMemo(() => ({ scrollY, resetScroll }), [scrollY])

  return (
    <TabBarScrollContext.Provider value={value}>
      {children}
    </TabBarScrollContext.Provider>
  )
}

export function useTabBarScroll() {
  const ctx = useContext(TabBarScrollContext)
  if (!ctx) {
    return { scrollY: new Animated.Value(0), resetScroll: () => {} }
  }
  return ctx
}
