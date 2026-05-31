/**
 * Postinstall — correctifs node_modules pour SENGUICHET.
 * Nettoyage des hacks dangereux qui cassent le Codegen de React Native.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

console.log('[postinstall] 🔧 Optimisation de l\'environnement…');

// On ne désactive plus le codegen, car cela casse SafeAreaView et les composants natifs.
// On se contente de s'assurer que les répertoires nécessaires existent.

const vvDir = path.join(ROOT, 'mobile', 'node_modules', 'react-native', 'src', 'private', 'components', 'virtualview');
if (!fs.existsSync(vvDir)) {
  try {
    fs.mkdirSync(vvDir, { recursive: true });
    console.log('  ✓ Structure VirtualView préparée');
  } catch (e) {}
}

console.log('[postinstall] ✅ Environnement prêt');
