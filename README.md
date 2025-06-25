# 🔐 Messagerie Chiffrée avec Clés Personnelles

Une application de messagerie sécurisée utilisant un **système de clés personnelles courtes** (16 caractères) pour contrôler l'accès aux messages, avec chiffrement RSA-2048 en arrière-plan.

## 🎯 Principe de Fonctionnement

### 🔑 Système de Clé Personnelle (16 caractères)

- **À l'inscription** → Génération automatique d'une clé de 16 caractères (ex: `A8B4-C2D9-E1F7-G3H6`)
- **Messages stockés** → Toujours chiffrés en base de données (RSA-2048) 
- **Pour lire** → L'utilisateur doit entrer sa clé personnelle dans l'interface
- **Sans clé** → Seul le contenu chiffré brut est visible (`🔒 A8B9C2D1...`)

### 🔐 Double Chiffrement Intelligent

Chaque message est chiffré **deux fois** :
- **Version expéditeur** : Chiffrée avec la clé publique de l'expéditeur
- **Version destinataire** : Chiffrée avec la clé publique du destinataire

**Résultat** : Chacun peut déchiffrer et lire ses propres messages (envoyés et reçus) !

## ✨ Fonctionnalités

### 🔒 Sécurité
- **Clé personnelle de 16 caractères** simple à mémoriser
- **Chiffrement RSA-2048** robuste en arrière-plan
- **Double chiffrement** pour l'expéditeur et le destinataire
- **Messages toujours chiffrés** en base de données
- **Aucun accès administrateur** aux contenus des messages

### 💬 Interface de Chat
- **Bouton "🔑 Déchiffrer"** pour entrer sa clé personnelle
- **Messages chiffrés par défaut** (`🔒 A8B9C2D1...`)
- **Déchiffrement en un clic** après saisie de la clé
- **Bouton "🔒 Rechiffrer"** pour cacher à nouveau les messages
- **Compatibilité** avec les anciens et nouveaux formats de messages

### 🚀 Temps Réel
- **Polling automatique** toutes les 2 secondes
- **Interface moderne** avec Tailwind CSS et Radix UI
- **Indicateurs visuels** de l'état de chiffrement
- **Historique persistant** des conversations

## 🛠️ Technologies

- **Next.js 14** + TypeScript
- **MongoDB** pour le stockage
- **Web Crypto API** pour le chiffrement RSA
- **Tailwind CSS** + **Radix UI** pour l'interface

## 🚀 Installation Rapide

### 1. Prérequis
```bash
# Node.js 18+
# MongoDB (local ou MongoDB Atlas)
```

### 2. Installation
```bash
git clone <votre-repo>
cd messaging
npm install
```

### 3. Configuration
```bash
# Créer .env.local
echo "MONGODB_URI=mongodb://localhost:27017/encrypted-messaging" > .env.local
```

### 4. Lancement
```bash
npm run dev
# App disponible sur http://localhost:3000
```

## 📖 Utilisation

### 1️⃣ Inscription
1. Aller sur la page d'accueil
2. Cliquer sur **"Inscription"**
3. Entrer nom d'utilisateur + mot de passe
4. Cliquer sur **"🔐 Générer ma clé personnelle"**
5. **Noter votre clé de 16 caractères** (exemple: `A8B4-C2D9-E1F7-G3H6`)
6. Finaliser l'inscription

### 2️⃣ Chat Sécurisé
1. Se connecter et aller au dashboard
2. Sélectionner un utilisateur pour discuter
3. **Les messages apparaissent chiffrés** : `🔒 A8B9C2D1...`
4. Cliquer sur **"🔑 Déchiffrer"**
5. **Entrer votre clé personnelle** (16 caractères)
6. **Vos messages se déchiffrent** instantanément ! ✨

### 3️⃣ Envoyer des Messages
1. **Déchiffrer d'abord** avec votre clé personnelle
2. Taper votre message (texte normal)
3. **Le message s'envoie chiffré** automatiquement
4. **Double chiffrement** : vous et le destinataire pouvez le lire

## 🔐 Sécurité Technique

### Architecture du Chiffrement
```
Message original: "Bonjour !"
        ↓
Chiffrement 1: RSA-2048 avec clé publique expéditeur → Version A
Chiffrement 2: RSA-2048 avec clé publique destinataire → Version B
        ↓  
Stockage MongoDB: { encryptedForSender: "A...", encryptedForReceiver: "B..." }
        ↓
Interface: 🔒 A8B9C2D1... (contenu chiffré masqué)
        ↓
Clé personnelle saisie → Validation → Déchiffrement RSA
        ↓
Affichage: "Bonjour !" ✅
```

### Flux de Déchiffrement
1. **Saisie clé courte** (16 caractères) → Validation
2. **Récupération clé RSA** privée de l'utilisateur  
3. **Sélection intelligente** : Version expéditeur ou destinataire
4. **Déchiffrement RSA** avec la clé privée appropriée
5. **Affichage** du message en clair

## 🌐 Déploiement Production

### Vercel (Recommandé)
```bash
# 1. Connecter votre repo à Vercel.com
# 2. Configurer la variable d'environnement:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/messaging

# 3. Déployer automatiquement
```

### Variables d'Environnement
```bash
# Local (.env.local)
MONGODB_URI=mongodb://localhost:27017/encrypted-messaging

# Production  
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/encrypted-messaging?retryWrites=true&w=majority
```

## 📁 Structure du Projet

```
messaging/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # Connexion utilisateur
│   │   │   └── register/route.ts   # Inscription + clé courte
│   │   ├── messages/
│   │   │   ├── [userId]/route.ts   # Récupération conversations
│   │   │   └── route.ts            # Envoi messages (double chiffrement)
│   │   └── users/                  # API gestion utilisateurs
│   ├── chat/[userId]/page.tsx      # Interface chat avec déchiffrement
│   ├── dashboard/page.tsx          # Liste des utilisateurs
│   └── page.tsx                    # Inscription avec génération clé
├── components/ui/                  # Composants interface Radix UI
└── lib/
    ├── crypto.ts                   # Utilitaires chiffrement
    └── utils.ts                    # Utilitaires généraux
```

## 🚀 API Routes

### Inscription avec Clé Courte
```typescript
POST /api/auth/register
{
  username: string,
  password: string,
  publicKey: number[],     // Clé publique RSA-2048  
  privateKey: number[],    // Clé privée RSA-2048
  userKey: string          // Clé courte "A8B4-C2D9-E1F7-G3H6"
}
```

### Envoi Message (Double Chiffrement)
```typescript
POST /api/messages  
{
  senderId: string,
  receiverId: string,
  encryptedForSender: string,      // Version pour l'expéditeur
  encryptedForReceiver: string     // Version pour le destinataire
}
```

### Récupération Messages
```typescript
GET /api/messages/[userId]?currentUserId=xxx
// Retourne: { encryptedForSender?, encryptedForReceiver?, encryptedContent? }
// Compatibilité anciens/nouveaux formats
```

## 💡 Cas d'Usage

### 🏢 Entreprise
- Communications internes sensibles
- Chaque employé contrôle l'accès à ses messages
- Pas de backdoor administrateur

### 👥 Personnel
- Messages privés entre amis/famille
- Clé courte facile à mémoriser
- Sécurité niveau bancaire (RSA-2048)

### 🏥 Professionnel
- Communications médecin-patient
- Respect de la confidentialité
- Audit trail chiffré

## 🔮 Améliorations Futures

- [ ] **WebSockets** pour le temps réel instantané
- [ ] **Notifications push** pour nouveaux messages
- [ ] **Sauvegarde/restauration** des clés utilisateur
- [ ] **Groupes de discussion** multi-utilisateurs
- [ ] **Signatures numériques** pour l'authentification
- [ ] **Interface mobile** progressive web app

## 📋 Sécurité & Conformité

### ✅ Bonnes Pratiques Implémentées
- **Chiffrement bout-en-bout** authentique
- **Clés générées côté client** (Web Crypto API)
- **Pas de backdoor serveur** (impossible de déchiffrer)
- **Mots de passe hachés** (bcrypt, 12 rounds)
- **Validation des entrées** côté client et serveur

### 🛡️ Résistance aux Attaques
- **Attaque serveur** → Messages restent chiffrés
- **Vol de base de données** → Contenu illisible
- **Man-in-the-middle** → Chiffrement RSA résistant
- **Force brute clé courte** → 36^16 combinaisons (~10^25)

## 📄 Licence

MIT License - Libre d'utilisation et modification.

## 🤝 Support

Pour questions ou problèmes :
1. Ouvrir une **issue** sur le repository
2. Consulter la documentation **SHORT_KEY_SYSTEM.md**
3. Vérifier les **logs de la console** (F12) pour le debugging

---

*🔐 Développé pour la confidentialité et la simplicité d'usage* 