// Hub Compte — écran central du profil et des accès utilisateur
// S'adapte selon le rôle connecté (acheteur/organisateur/controleur) ou invité
// Acheteur non connecté : boutons connexion/inscription
// Acheteur connecté : infos profil + lien vers espace organisateur
// Organisateur : raccourci dashboard
// Contrôleur : stats scan + historique
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

export default function ProfilScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { role, email, user, profil, deconnecter } = useAuth()
  const isLoggedIn = !!role
  const estAcheteur = role === 'acheteur'
  const estOrganisateur = role === 'organisateur'
  const estControleur = role === 'controleur'

  const nomAffiche = email || profil?.email || user?.email || 'Utilisateur'

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* En-tête */}
          <View style={styles.headerSection}>
            <View style={styles.avatar}>
              <Feather name="user" size={32} color={colors.primary} />
            </View>
            <Text style={styles.titre}>Compte</Text>
            <Text style={styles.sousTitre}>Connecte-toi pour accéder à tes billets</Text>
          </View>

          {/* Actions connexion */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SocialAuth')}>
            <Feather name="log-in" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Se connecter</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InscriptionOrganisateur')}>
            <Feather name="user-plus" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Créer un compte organisateur</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Déjà un code contrôleur ?</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnexionControleur')}>
            <Feather name="shield" size={20} color={colors.accent} />
            <Text style={styles.actionBtnText}>Mode contrôleur</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  if (estControleur) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* En-tête */}
          <View style={styles.headerSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Feather name="shield" size={28} color={colors.primary} />
            </View>
            <Text style={styles.titre}>Contrôleur</Text>
            <Text style={styles.sousTitre}>{email || 'Connecté'}</Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scanner')}>
            <Feather name="camera" size={20} color={colors.green} />
            <Text style={styles.actionBtnText}>Scanner un QR code</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ScanHistory')}>
            <Feather name="clock" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Historique des scans</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionBtn} onPress={deconnecter}>
            <Feather name="log-out" size={20} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // Acheteur ou organisateur connecté
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.headerSection}>
          <View style={styles.avatar}>
            <Feather name="user" size={32} color={colors.primary} />
          </View>
          <Text style={styles.titre}>{nomAffiche}</Text>
          <Text style={styles.sousTitre}>
            {estOrganisateur ? 'Organisateur' : 'Acheteur'}
          </Text>
        </View>

        {/* Actions acheteur */}
        {estAcheteur && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MesTickets')}>
              <Ionicons name="ticket-outline" size={20} color={colors.primary} />
              <Text style={styles.actionBtnText}>Mes billets</Text>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnexionOrganisateur')}>
              <Feather name="briefcase" size={20} color={colors.accent} />
              <Text style={styles.actionBtnText}>Espace organisateur</Text>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </>
        )}

        {/* Actions organisateur */}
        {estOrganisateur && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('OrganisateurDashboard')}>
              <Feather name="layout" size={20} color={colors.primary} />
              <Text style={styles.actionBtnText}>Dashboard organisateur</Text>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('GestionEvenements')}>
              <Feather name="calendar" size={20} color={colors.primary} />
              <Text style={styles.actionBtnText}>Mes événements</Text>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </>
        )}

        {/* Commun — support & déconnexion */}
        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Support')}>
          <Feather name="headphones" size={20} color={colors.primary} />
          <Text style={styles.actionBtnText}>Support</Text>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={deconnecter}>
          <Feather name="log-out" size={20} color={colors.danger} />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  headerSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titre: {
    fontSize: 22, fontFamily: fonts.outfit.bold,
    color: colors.text, marginBottom: spacing.xs,
  },
  sousTitre: {
    fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  actionBtnText: {
    flex: 1, fontSize: 15, fontFamily: fonts.jakarta.semiBold,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 13, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
})
