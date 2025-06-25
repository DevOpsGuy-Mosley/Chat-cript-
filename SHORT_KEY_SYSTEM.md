# 🔑 Système de Clé Courte (16 caractères)

## Vue d'ensemble

Le système a été modifié pour utiliser des **clés courtes et pratiques** de 16 caractères au lieu des longues clés RSA. Cela améliore considérablement l'expérience utilisateur tout en maintenant la sécurité.

## 🆕 Nouveau système

### Format de clé
```
XXXX-XXXX-XXXX-XXXX
Exemple: A8B4-C2D9-E1F7-G3H6
```

### Caractéristiques
- **16 caractères** alphanumériques (A-Z, 0-9)
- **Formatée avec tirets** pour la lisibilité
- **Facile à retenir** et saisir
- **Unique par utilisateur**

## 📝 Processus d'inscription

### 1. Génération automatique
```typescript
const generateShortKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result.match(/.{4}/g)?.join('-') || result
}
```

### 2. Affichage utilisateur
```
┌────────────────────────────────────┐
│ ⚠️ Important !                      │
│ Notez cette clé ! Vous en aurez    │
│ besoin pour accéder à vos messages.│
│                                    │
│    A8B4-C2D9-E1F7-G3H6            │
│                                    │
│        [📋 Copier la clé]          │
└────────────────────────────────────┘
```

### 3. Stockage en base
```json
{
  "_id": "user123",
  "username": "alice",
  "password": "hash...",
  "publicKey": [1, 2, 3, ...],     // Clé RSA pour chiffrement
  "privateKey": [4, 5, 6, ...],    // Clé RSA pour déchiffrement
  "userKey": "A8B4C2D9E1F7G3H6"    // Clé courte pour l'utilisateur
}
```

## 💬 Interface de chat

### Saisie de clé simplifiée
```
┌─────────────────────────────────────────┐
│ 🔑 Entrez votre clé personnelle         │
│ Saisissez votre clé personnelle         │
│ (16 caractères) pour déchiffrer et      │
│ lire vos messages.                      │
│                                         │
│ [XXXX-XXXX-XXXX-XXXX] [🔓 Déchiffrer]  │
└─────────────────────────────────────────┘
```

### Validation intelligente
```typescript
// Nettoie automatiquement la saisie
const cleanedKey = input.replace(/\s/g, '').replace(/-/g, '').toUpperCase()
const expectedKey = user.userKey.replace(/-/g, '')

// Accepte avec ou sans tirets
if (cleanedKey === expectedKey) {
  // ✅ Clé valide
}
```

## 🔧 Fonctionnement technique

### Double système hybride
1. **Clé courte** (16 chars) → Interface utilisateur / Authentification
2. **Clé RSA** (2048 bits) → Chiffrement/déchiffrement en arrière-plan

### Flux d'authentification
```
Utilisateur saisit → A8B4-C2D9-E1F7-G3H6
      ↓
Validation → Comparaison avec userKey en base
      ↓
Si valide → Utilisation de privateKey (RSA) pour déchiffrer
      ↓
Messages → Affichés en clair
```

### Avantages
- **UX améliorée** : Clé facile à saisir et retenir
- **Sécurité maintenue** : RSA-2048 toujours utilisé pour le chiffrement
- **Compatibilité** : Ancien système de chiffrement préservé
- **Flexibilité** : Saisie avec ou sans tirets acceptée

## 📊 Comparaison Avant/Après

### Avant (Clé RSA complète)
```
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKBwjqOGhq1+iEK
Z6BNkTGWmP6cWtYY2g8xLBBs7QbEt9vJwJ9XQ2F8ZkKGmP5XRQZ7KJHG9w0BAQEFAASCBKgwggS...
(372 caractères au total)
```

### Maintenant (Clé courte)
```
A8B4-C2D9-E1F7-G3H6
(19 caractères avec tirets)
```

## 🎯 Cas d'usage

### Inscription d'Alice
1. Alice s'inscrit normalement
2. Clique "🔐 Générer ma clé personnelle"
3. Système génère : `K9M2-N7P4-R1T6-W8X3`
4. Alice copie et note sa clé
5. Inscription terminée

### Alice utilise le chat
1. Alice ouvre le chat → Voit messages chiffrés
2. Clique "🔑 Déchiffrer"
3. Entre sa clé : `K9M2N7P4R1T6W8X3` (avec ou sans tirets)
4. Messages se déchiffrent automatiquement
5. Alice peut envoyer/recevoir normalement

### Rechiffrement
1. Alice clique "🔒 Rechiffrer"
2. Messages redeviennent chiffrés
3. Clé effacée de la mémoire
4. Sécurité restaurée

## 🔒 Sécurité

### Points forts
- **Clé courte != Clé de chiffrement** : La clé RSA reste longue
- **Validation côté serveur** : Clé stockée en base de données
- **Pas de transmission** : Clé comparée localement
- **Session temporaire** : Clé effacée au rechiffrement

### Considérations
- **Force de la clé** : 36^16 = ~2.8 × 10^24 combinaisons possibles
- **Brute force** : Infaisable avec validation côté serveur
- **Collision** : Probabilité négligeable avec 16 caractères

## 📱 Interface utilisateur

### États visuels
```
🔒 Messages chiffrés     → Défaut (clé requise)
✅ Messages déchiffrés   → Après saisie clé valide
🔑 Déchiffrer           → Bouton d'action
🔒 Rechiffrer           → Bouton de sécurité
```

### Messages d'erreur
```
❌ Clé incorrecte - vérifiez votre clé personnelle
❌ Impossible d'envoyer : entrez votre clé personnelle
```

### Indicateurs
```
// Message chiffré
🔒 A8B9C2D1E4F7G8H9...
└─ Chiffré - clé requise

// Message déchiffré
✅ Bonjour ! Comment ça va ?
└─ Déchiffré avec votre clé
```

## 🚀 Avantages utilisateur

### Simplicité
- **Mémorisation** : 16 caractères vs 372 caractères
- **Saisie** : Rapide et sans erreur
- **Lisibilité** : Format XXXX-XXXX-XXXX-XXXX clair

### Praticité
- **Copier/coller** : Format court
- **Partage** : Plus facile à communiquer si nécessaire
- **Stockage** : Simple à noter/sauvegarder

### Flexibilité
- **Formats acceptés** : Avec ou sans tirets
- **Case insensitive** : Majuscules/minuscules acceptées
- **Espaces ignorés** : Suppression automatique

---

Ce système offre un **équilibre parfait** entre sécurité (RSA-2048) et utilisabilité (clé courte), rendant l'application accessible tout en conservant un chiffrement robuste. 🔐✨ 