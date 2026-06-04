// Service d'upload vers Cloudinary pour les affiches d'événements
// Utilise un upload preset non signé (pas besoin d'API key/secrète côté client)

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/**
 * Upload d'une image vers Cloudinary
 * @param {object} asset - Asset retourné par expo-image-picker (contient uri, type, fileName)
 * @returns {Promise<string>} URL sécurisée de l'image uploadée
 */
export const uploadImage = async (asset) => {
  const formData = new FormData()
  
  // React Native nécessite un objet avec uri/type/name pour le champ file
  formData.append('file', {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: asset.fileName || 'photo.jpg',
  })
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Upload Cloudinary échoué: ${err}`)
  }

  const data = await res.json()
  return data.secure_url
}
