// Écran de changement de mot de passe de l'organisateur
// Design glass (Apple Invites) avec animation d'entrée
import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, fonts } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { appelAPI } from '../../services/apiService'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'

export default function ChangerMotDePasseScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [ancienMotDePasse, setAncienMotDePasse] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('')
  const [showAncien, setShowAncien] = useState(false)
  const [showNouveau, setShowNouveau] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const slideAnim = useRef(new Animated.Value(30)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [])

  function valider() {
    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmMotDePasse) {
      setErreur('Tous les champs sont requis')
      return false
    }
    if (nouveauMotDePasse.length < 6) {
      setErreur('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return false
    }
    if (nouveauMotDePasse !== confirmMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas')
      return false
    }
    return true
  }

  async function soumettre() {
    setErreur('')
    if (!valider()) return
    setLoading(true)
    try {
      await appelAPI('/auth/organisateur/changer-mot-de-passe', {
        method: 'PUT',
        body: { ancienMotDePasse, nouveauMotDePasse },
      })
      Alert.alert('Succès', 'Mot de passe modifié avec succès')
      navigation.goBack()
    } catch (err) {
      setErreur(err.message)
    }
    setLoading(false)
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <OrganisateurLayout />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Modifier le mot de passe</Text>
        <View style={{ width: 40 }} />
      </View>
      <Animated.View style={[s.formWrapper, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
        <GlassContainer blurType="light" style={s.form} intensity={35}>
          <View style={s.fieldGroup}>
            <Text style={s.label}>Mot de passe actuel</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showAncien}
                value={ancienMotDePasse}
                onChangeText={setAncienMotDePasse}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowAncien(!showAncien)} style={s.eyeBtn}>
                <Feather name={showAncien ? 'eye' : 'eye-off'} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.fieldGroup}>
            <Text style={s.label}>Nouveau mot de passe</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="Min. 6 caractères"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showNouveau}
                value={nouveauMotDePasse}
                onChangeText={setNouveauMotDePasse}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNouveau(!showNouveau)} style={s.eyeBtn}>
                <Feather name={showNouveau ? 'eye' : 'eye-off'} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.fieldGroup}>
            <Text style={s.label}>Confirmer le nouveau mot de passe</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="Répète le mot de passe"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showConfirm}
                value={confirmMotDePasse}
                onChangeText={setConfirmMotDePasse}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                <Feather name={showConfirm ? 'eye' : 'eye-off'} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}

          <TouchableOpacity style={s.submitBtn} onPress={soumettre} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </GlassContainer>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.text },
  formWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  form: { padding: spacing.lg },
  fieldGroup: { paddingVertical: spacing.sm },
  label: { fontSize: 13, fontFamily: fonts.jakarta.medium, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  input: {
    flex: 1, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    fontSize: 15, fontFamily: fonts.jakarta.regular, color: colors.text,
  },
  eyeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  erreur: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.danger, marginTop: spacing.sm, textAlign: 'center' },
  submitBtn: {
    marginTop: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.accent, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff' },
})
