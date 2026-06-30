# beauté

Plateforme de mise en relation entre clientes et professionnelles de la beauté (coiffure, esthétique, nail art, massage, maquillage). Réservation en ligne + boutique produits.

## Stack

- **Frontend** : React 18 + Vite + TailwindCSS + TypeScript
- **Backend** : Node.js + Express + TypeScript
- **BDD** : PostgreSQL + Prisma ORM
- **Auth** : JWT (email/mot de passe, rôles : client / pro / admin)
- **Stockage images** : local (`backend/uploads/`) en dev

---

## Installation et lancement

### Prérequis

- Node.js 20+
- Docker Desktop (pour PostgreSQL)
- pnpm ou npm

### 1. Démarrer la base de données

```bash
docker-compose up -d
```

PostgreSQL sera disponible sur `localhost:5432`.

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier et configurer le .env
cp .env.example .env

# Exécuter les migrations Prisma
npm run db:migrate

# Charger les données de test (6 pros fictives)
npm run db:seed

# Démarrer le serveur en mode dev
npm run dev
```

Le backend écoute sur **http://localhost:3001**.

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur Vite
npm run dev
```

L'application est disponible sur **http://localhost:5173**.

---

## Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@beaute.fr | Admin@1234 |
| Cliente | cliente@test.fr | Test@1234 |
| Professionnelle (x6) | `<prenom>.<specialite>@beaute.fr` | Pro@1234 |

Exemples pros :
- sophie.coiffure@beaute.fr (Paris · Coiffure)
- camille.esthe@beaute.fr (Lyon · Esthétique + Massage)
- lea.nailart@beaute.fr (Bordeaux · Nail Art)
- marie.maquillage@beaute.fr (Paris · Maquillage)
- julia.massage@beaute.fr (Marseille · Massage)
- inès.beaute@beaute.fr (Toulouse · Coiffure + Esthétique)

---

## API — Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register/client` | Inscription cliente |
| POST | `/api/auth/register/pro` | Inscription pro (SIRET requis) |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil courant |
| GET | `/api/pros` | Liste des pros (filtres : search, specialty, city) |
| GET | `/api/pros/:id` | Profil d'un pro |
| GET | `/api/pros/:id/slots?date=YYYY-MM-DD` | Créneaux disponibles |
| PUT | `/api/pros/me/profile` | Modifier son profil pro |
| PUT | `/api/pros/me/services` | Gérer ses prestations |
| PUT | `/api/pros/me/availabilities` | Gérer ses disponibilités |
| POST | `/api/appointments` | Créer un rendez-vous |
| GET | `/api/appointments/mine` | Mes RDV (cliente) |
| GET | `/api/appointments/pro` | RDV reçus (pro) |
| GET | `/api/products` | Liste produits |
| POST | `/api/products` | Ajouter un produit (pro) |
| POST | `/api/orders` | Passer une commande |
| GET | `/api/admin/pros` | Liste pros (admin) |

---

## Structure du projet

```
beaute/
├── backend/
│   ├── prisma/          schema.prisma + seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── uploads/         images (dev local)
├── frontend/
│   └── src/
│       ├── components/  ui / layout / pro / booking / shop
│       ├── pages/
│       ├── lib/         api.ts + store.ts (Zustand)
│       └── types/
├── docker-compose.yml
└── README.md
```

---

## Déploiement (prod)

- **Backend** : Railway ou Render (ajouter les variables d'env, remplacer `UPLOAD_DIR` par une URL S3/Cloudinary)
- **Frontend** : Vercel ou Netlify (`npm run build`, servir le dossier `dist/`)
- **BDD** : Railway PostgreSQL ou Supabase
