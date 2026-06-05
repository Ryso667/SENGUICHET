// Hook useValidation : validation de formulaire en temps réel
// Supporte required, minLength, maxLength, pattern, phone, custom
import { useState, useCallback, useMemo } from 'react'

// Expression régulière pour le format téléphone sénégalais : +221 XX XXX XX XX
const PHONE_REGEX = /^\+221[ ]?\d{2}[ ]?\d{3}[ ]?\d{2}[ ]?\d{2}$/

// Valide un champ unique selon ses règles
// @param {*} value - valeur du champ
// @param {Object} rules - règles de validation pour ce champ
// @param {Object} allValues - toutes les valeurs du formulaire (pour custom)
// Retourne null si valide, une chaîne d'erreur sinon
function validateField(value, rules, allValues = {}) {
  for (const [rule, param] of Object.entries(rules)) {
    if (rule === 'message') continue
    if (rule === 'required' && param) {
      if (value === undefined || value === null || String(value).trim() === '') {
        return rules.message || 'Ce champ est requis'
      }
    }
    if (rule === 'minLength') {
      if (value && String(value).length < param) {
        return rules.message || `Minimum ${param} caractères`
      }
    }
    if (rule === 'maxLength') {
      if (value && String(value).length > param) {
        return rules.message || `Maximum ${param} caractères`
      }
    }
    if (rule === 'pattern' && value) {
      if (!param.test(String(value))) {
        return rules.message || 'Format invalide'
      }
    }
    if (rule === 'phone' && param && value) {
      if (!PHONE_REGEX.test(String(value))) {
        return rules.message || 'Format : +221 XX XXX XX XX'
      }
    }
    if (rule === 'custom' && value) {
      const err = param(value, allValues)
      if (err) return err
    }
  }
  return null
}

// Valide l'ensemble des champs
function validateAll(values, rules) {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(rules)) {
    const err = validateField(values[field], fieldRules, values)
    if (err) errors[field] = err
  }
  return errors
}

// Hook de validation de formulaire en temps réel
// @param {Object} rules - { fieldName: { required, minLength, maxLength, pattern, phone, custom, message } }
// Retourne { values, errors, touched, handleChange, handleBlur, isValid, reset, setValues }
export function useValidation(rules = {}) {
  // Initialise les valeurs avec des chaînes vides pour chaque champ
  // Sera remplacé par API
  const initialValues = useMemo(() => {
    const init = {}
    for (const key of Object.keys(rules)) init[key] = ''
    return init
  }, [rules])

  const [values, setValuesState] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Met à jour la valeur d'un champ et valide immédiatement
  // @param {string} field - nom du champ
  // @param {*} value - nouvelle valeur
  const handleChange = useCallback((field, value) => {
    setValuesState(prev => {
      const next = { ...prev, [field]: value }
      // Validation avec toutes les valeurs pour permettre les règles custom cross-champs
      setErrors(current => {
        const err = validateField(value, rules[field] || {}, next)
        if (err) return { ...current, [field]: err }
        const updated = { ...current }
        delete updated[field]
        return updated
      })
      return next
    })
  }, [rules])

  // Marque un champ comme touché (blur)
  // @param {string} field - nom du champ
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  // Réinitialise tout le formulaire
  const reset = useCallback(() => {
    setValuesState(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  // Remplace toutes les valeurs et revalide l'ensemble
  // @param {Object} newValues - nouvelles valeurs
  const setValues = useCallback((newValues) => {
    setValuesState(newValues)
    const newErrors = validateAll(newValues, rules)
    setErrors(newErrors)
  }, [rules])

  // isValide : true seulement si aucun champ n'a d'erreur
  // ET si tous les champs required ont été touchés
  const isValid = useMemo(() => {
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) return false
    const allRequiredTouched = Object.entries(rules)
      .filter(([, fieldRules]) => fieldRules.required)
      .every(([field]) => touched[field])
    return allRequiredTouched
  }, [errors, rules, touched])

  return { values, errors, touched, handleChange, handleBlur, isValid, reset, setValues }
}
