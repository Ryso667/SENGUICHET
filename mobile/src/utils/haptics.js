// src/utils/haptics.js
// Utilitaire pour le feedback haptique (vibrations tactiles)
// Utilise expo-haptics pour les retours de type impact, notification et selection

import * as Haptics from 'expo-haptics';

// Feedback d'impact léger - pour boutons secondaires, tabs, OTP
export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

// Feedback d'impact moyen - pour boutons principaux, actions importantes
export const hapticMedium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

// Feedback d'impact fort - pour actions destructives, alertes
export const hapticHeavy = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

// Feedback de succès - pour validation, scan réussi
export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

// Feedback d'erreur - pour échec, scan invalide, erreur formulaire
export const hapticError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

// Feedback d'avertissement - pour actions dangereuses
export const hapticWarning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

// Feedback de sélection - pour pickers, changements discrets
export const hapticSelection = () => {
  Haptics.selectionAsync();
};
