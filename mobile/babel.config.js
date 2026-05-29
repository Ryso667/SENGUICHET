// Configuration Babel pour Expo SDK 54
// Reanimated 3 requiert le plugin manuellement (dernier dans la liste)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
