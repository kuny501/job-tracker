# Suivi Candidatures — Job Tracker

Outil de suivi de candidatures personnel, pré-rempli avec tes pistes actives.

## Déploiement sur Vercel (le plus simple)

### Option A : Via GitHub (recommandé)

1. Crée un repo GitHub et push ce dossier :
   ```bash
   cd job-tracker
   git init
   git add .
   git commit -m "init: job tracker"
   git remote add origin https://github.com/TON-USERNAME/job-tracker.git
   git push -u origin main
   ```

2. Va sur [vercel.com](https://vercel.com) → "Add New Project"
3. Connecte ton repo GitHub
4. Clique "Deploy" — c'est tout, Vercel détecte Vite automatiquement

### Option B : Via CLI

```bash
npm install
npx vercel
```

Suis les instructions, Vercel te donne une URL type `job-tracker-xxx.vercel.app`.

## Développement local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173

## Fonctionnalités

- Ajout / modification / suppression de pistes
- Filtres par statut, tri par priorité / date / nom
- Surlignage des échéances dans les 7 prochains jours
- Export / Import JSON pour backup
- Données persistées dans localStorage

## Stack

- React 18 + Vite
- Pas de dépendances externes côté UI
- Google Fonts (Outfit)
