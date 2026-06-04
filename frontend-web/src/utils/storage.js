// Fichier : storage.js
// Rôle : Gestion du stockage local du token JWT uniquement
// Note : Les informations utilisateur sont extraites du JWT décodé côté client,
//        jamais stockées en clair dans le localStorage

export const saveToken = (token) => {
  localStorage.setItem("jwt_token", token);
};

export const getToken = () => {
  return localStorage.getItem("jwt_token");
};

export const removeToken = () => {
  localStorage.removeItem("jwt_token");
};

export const clearAll = () => {
  removeToken();
};
