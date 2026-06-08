# Migration Aiven — Mise en production complète

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Nettoyer la base Aiven, migrer toutes les tables, et configurer tous les composants (backend, frontend-web, mobile) pour pointer vers le cloud.

**Architecture:**
- Backend Express (Vercel serverless) → Aiven MySQL
- Frontend-web React/Vite → API Vercel
- Mobile React Native (Expo) → API Vercel
- Le script `migrate-aiven.js` drop toutes les tables puis recrée depuis `schema.sql`

**Tech Stack:** Node.js, MySQL (Aiven), Vercel, Express, Vite

---

### Task 1: Créer le script de migration Aiven

**Files:**
- Create: `backend/src/db/migrate-aiven.js`

- [ ] **Écrire `migrate-aiven.js`**

```js
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function migrateAiven() {
  const sslConfig = process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    multipleStatements: true,
  });

  try {
    console.log("🗑️ Suppression des tables existantes...");
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME]
    );
    for (const t of tables) {
      await connection.query(`DROP TABLE IF EXISTS \`${t.TABLE_NAME}\``);
      console.log(`  ✗ ${t.TABLE_NAME} supprimée`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS=1");

    console.log("\n🏗️ Création des tables...");
    let sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    sql = sql.replace(/CREATE DATABASE .*?;/i, "");
    sql = sql.replace(/USE .*?;/i, "");
    sql = "SET FOREIGN_KEY_CHECKS=0;\n" + sql + "\nSET FOREIGN_KEY_CHECKS=1;\n";
    await connection.query(sql);
    console.log("✅ Toutes les tables créées avec succès");

    console.log("\n📦 Données initiales insérées (admin + organisateur test)");
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateAiven();
```

### Task 2: Configurer .env local avec Aiven

**Files:**
- Modify: `backend/.env` (remplacer les credentials DB)

- [ ] **Mettre à jour `backend/.env`**

Les credentials Aiven seront récupérés de Vercel (ou saisis par l'utilisateur). Les valeurs de remplacement :

```
DB_HOST=mysql-364674f7-muhamedndiaye00-1360.l.aivencloud.com
DB_PORT=12444
DB_USER=avnadmin
DB_PASSWORD=<password_from_vercel>
DB_NAME=defaultdb
DB_SSL=true
```

### Task 3: Récupérer le mot de passe Aiven et exécuter la migration

- [ ] **Extraire DB_PASSWORD de Vercel**

```bash
cd backend && vercel env run -- node -e "fs.writeFileSync('.dbpass', process.env.DB_PASSWORD)"
```

Ou créer un petit script d'extraction si `vercel env run` ne fonctionne pas.

- [ ] **Exécuter la migration**

```bash
cd backend
node src/db/migrate-aiven.js
```

Vérifier la sortie : toutes les tables créées, seed data insérée.

### Task 4: Configurer le frontend-web

**Files:**
- Create: `frontend-web/.env`

- [ ] **Créer `frontend-web/.env`**

```
VITE_API_URL=https://backend-beta-six-39.vercel.app
```

### Task 5: Redéployer le backend sur Vercel

- [ ] **Déploiement Vercel**

```bash
cd backend && vercel deploy --prod
```

### Task 6: Tester tous les endpoints critiques

- [ ] **Tester l'API health**
```bash
curl https://backend-beta-six-39.vercel.app/api/health
# → {"status":"OK",...}
```

- [ ] **Tester la soumission partenaire**
```bash
curl -X POST https://backend-beta-six-39.vercel.app/api/partenaires \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","organisation":"TestOrg","telephone":"771234567","email":"test@t.com","typeEvenement":"concert","nbEvenements":"1-3","siteWeb":"","description":"test"}'
# → {"message":"Votre demande a bien été envoyée...","id":1}
```

- [ ] **Tester la liste des événements publics**
```bash
curl https://backend-beta-six-39.vercel.app/api/evenements/public
# → [] (table vide après nettoyage)
```

- [ ] **Tester l'envoi d'email OTP**
```bash
curl -X POST https://backend-beta-six-39.vercel.app/api/auth/acheteur/envoyer-code \
  -H "Content-Type: application/json" \
  -d '{"email":"muhamedndiaye00@gmail.com"}'
# → Code OTP reçu par email
```
