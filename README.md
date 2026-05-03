# PrestaLaunch

Application de bureau macOS pour créer et gérer des sites PrestaShop locaux via Docker, sans toucher à la ligne de commande.

Built with **Tauri v2** · **React 19** · **Rust** · **SQLite** · **Docker Compose**

---

## Fonctionnalités

- **Créer un site** en quelques clics — choisissez la version PS, PHP, MySQL ; le domaine `.local` et les ports sont configurés automatiquement
- **Démarrer / Arrêter** les conteneurs Docker du site
- **HTTPS local** via mkcert + nginx (installé automatiquement via Homebrew si absent)
- **phpMyAdmin** intégré par site (port dédié)
- **Mailpit** (mailcatcher) par site — intercepte les e-mails sortants PrestaShop
- **Logs en temps réel** des conteneurs
- **Ouvrir dans** Finder, VS Code ou Terminal
- **Suppression propre** — arrêt des conteneurs, suppression des volumes, nettoyage `/etc/hosts`
- **Templates** prédéfinis et personnalisables (Standard, Legacy, Dev)

---

## Prérequis

| Outil | Version minimale | Notes |
|-------|-----------------|-------|
| macOS | 13 Ventura | Apple Silicon & Intel |
| Docker Desktop | 4.x | Doit être lancé |
| Homebrew | toute | Pour l'installation auto de mkcert |

> mkcert est installé automatiquement au premier usage HTTPS.

---

## Installation

### En développement

```bash
# Cloner
git clone https://github.com/alexis/prestalaunch.git
cd prestalaunch

# Dépendances JS
npm install

# Lancer (Tauri dev avec hot-reload)
npm run tauri dev
```

**Prérequis Rust :**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Build de production

```bash
npm run tauri build
# → src-tauri/target/release/bundle/macos/prestalaunch.app
```

---

## Architecture

```
prestalaunch/
├── src/                        # Frontend React
│   ├── components/
│   │   ├── atoms/              # Button, StatusDot, Badge, Modal
│   │   ├── molecules/          # SiteCard, CreateSiteModal, LogsModal
│   │   └── organisms/          # Sidebar
│   ├── pages/                  # Sites, SiteDetail, Settings, Onboarding
│   ├── stores/                 # Zustand (sites, engine status)
│   └── types/                  # Types TypeScript partagés
│
└── src-tauri/                  # Backend Rust
    ├── src/
    │   ├── commands/           # Handlers Tauri (sites, app, engine)
    │   ├── models/             # Structs Rust (Site, Template…)
    │   └── services/           # Logique métier
    │       ├── compose.rs      # Génération docker-compose.yml + nginx.conf
    │       ├── db.rs           # Pool SQLite (sqlx)
    │       ├── docker.rs       # Wrapper docker compose CLI
    │       ├── hosts.rs        # Édition /etc/hosts
    │       └── sites.rs        # CRUD sites
    └── migrations/             # SQLite migrations (sqlx-migrate)
```

### Cycle de vie d'un site

```
Créer  →  /etc/hosts + docker-compose.yml générés  →  stopped
Démarrer  →  docker compose up -d  →  starting → running
Activer HTTPS  →  mkcert + nginx.conf  →  ssl_port assigné
Désactiver HTTPS  →  nginx stop + ssl_port = NULL
Supprimer  →  docker compose down -v  →  /etc/hosts nettoyé  →  DB supprimée
```

### SSL local (nginx reverse proxy)

PrestaShop tourne en HTTP pur sur son port dédié. Quand HTTPS est activé :

1. `mkcert domain.local` génère `cert.pem` + `key.pem` dans `sites/<id>/certs/`
2. Un service **nginx** est ajouté au compose — écoute sur `ssl_port:443`, proxifie vers `prestashop:80`
3. Le header `Host: domain.local:<port>` est transmis pour que PrestaShop reconnaisse ses propres URLs
4. PrestaShop reste en mode HTTP ; nginx assure la terminaison TLS

---

## Structure des données

```sql
sites (
  id TEXT, name TEXT, domain TEXT UNIQUE,
  ps_version, php_version, mysql_version,
  port INTEGER UNIQUE, pma_port INTEGER UNIQUE,
  ssl_port INTEGER,   -- NULL si HTTPS inactif
  mail_port INTEGER,  -- NULL si Mailpit inactif
  status TEXT,        -- stopped | starting | running | error
  created_at TEXT
)

templates (
  id, name, ps_version, php_version, mysql_version,
  is_default INTEGER, user_created INTEGER
)

settings (key TEXT PRIMARY KEY, value TEXT)
```

---

## Commandes Tauri exposées

| Commande | Description |
|----------|-------------|
| `list_sites` | Liste tous les sites |
| `create_site` | Crée un site + génère compose + /etc/hosts |
| `start_site` | `docker compose up -d` |
| `stop_site` | `docker compose stop` |
| `delete_site` | `docker compose down -v` + nettoyage |
| `get_site_logs` | Logs des conteneurs |
| `enable_ssl` | Installe mkcert si absent, génère certs, relance compose |
| `disable_ssl` | Retire nginx du compose, `ssl_port = NULL` |
| `enable_mail` | Ajoute Mailpit au compose |
| `disable_mail` | Retire Mailpit du compose |
| `open_site_folder` | Ouvre dans Finder / VS Code / Terminal |
| `check_engine` | Vérifie que Docker est disponible |

---

## Développement

```bash
# Type-check frontend
npx tsc --noEmit

# Check Rust
cd src-tauri && cargo check

# Hot-reload complet
npm run tauri dev
```

Les migrations SQLite sont appliquées automatiquement au démarrage via `sqlx::migrate!`.

---

## Licence

Projet privé — Alexis Pontikis / Ponti'Com
