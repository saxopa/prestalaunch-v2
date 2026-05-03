# PrestaLaunch

> Application de bureau pour créer et gérer des sites PrestaShop locaux via Docker, sans ligne de commande.

[![Release](https://img.shields.io/github/v/release/saxopa/prestalaunch-v2?label=télécharger&color=4f46e5)](https://github.com/saxopa/prestalaunch-v2/releases/latest)
[![License: MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-blue)](https://tauri.app)

Built with **Tauri v2** · **React 19** · **Rust** · **SQLite** · **Docker Compose**

---

## Télécharger

**[→ Dernière version (Releases)](https://github.com/saxopa/prestalaunch-v2/releases/latest)**

| Système | Fichier à télécharger |
|---|---|
| macOS Apple Silicon (M1/M2/M3/M4) | `PrestaLaunch_*_aarch64.dmg` |
| macOS Intel | `PrestaLaunch_*_x64.dmg` |
| Windows | `PrestaLaunch_*_x64-setup.exe` |

> **Prérequis unique :** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et en cours d'exécution.

### macOS — premier lancement

1. Ouvrez le `.dmg` et glissez **PrestaLaunch** dans **Applications**
2. Clic droit → **Ouvrir** (contournement Gatekeeper — l'app n'est pas signée Apple)

---

## Fonctionnalités

- **Créer un site** en quelques clics — version PS, PHP, MySQL ; domaine `.local` et ports configurés automatiquement
- **Démarrer / Arrêter** les conteneurs Docker du site
- **HTTPS local** via mkcert + nginx (installé automatiquement via Homebrew si absent)
- **phpMyAdmin** intégré par site (port dédié)
- **Mailpit** (mailcatcher) par site — intercepte les e-mails sortants PrestaShop
- **Logs en temps réel** des conteneurs
- **Ouvrir dans** Finder, VS Code ou Terminal
- **Suppression propre** — arrêt des conteneurs, suppression des volumes, nettoyage `/etc/hosts`
- **Templates** prédéfinis et personnalisables (Standard, Legacy, Dev)

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
Créer      →  /etc/hosts + docker-compose.yml générés  →  stopped
Démarrer   →  docker compose up -d  →  starting → initializing → running
HTTPS ON   →  mkcert + nginx.conf  →  ssl_port assigné
HTTPS OFF  →  nginx stop + ssl_port = NULL
Supprimer  →  docker compose down -v  →  /etc/hosts nettoyé  →  DB supprimée
```

### SSL local (nginx reverse proxy)

PrestaShop tourne en HTTP pur sur son port dédié. Quand HTTPS est activé :

1. `mkcert domain.local` génère `cert.pem` + `key.pem` dans `sites/<id>/certs/`
2. Un service **nginx** est ajouté au compose — écoute sur `ssl_port`, proxifie vers `prestashop:80`
3. Le header `Host` est transmis pour que PrestaShop reconnaisse ses URLs
4. PrestaShop reste en mode HTTP ; nginx assure la terminaison TLS

---

## Développement

**Prérequis :** [Rust](https://rustup.rs), [Node.js 20+](https://nodejs.org), [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone https://github.com/saxopa/prestalaunch-v2.git
cd prestalaunch-v2
npm install
npm run tauri dev
```

```bash
# Type-check frontend
npx tsc --noEmit

# Check Rust
cd src-tauri && cargo check

# Build de production
npm run tauri build
```

---

## Structure des données

```sql
sites (
  id TEXT, name TEXT, domain TEXT UNIQUE,
  ps_version, php_version, mysql_version,
  port INTEGER UNIQUE, pma_port INTEGER UNIQUE,
  ssl_port INTEGER,   -- NULL si HTTPS inactif
  mail_port INTEGER,  -- NULL si Mailpit inactif
  status TEXT,        -- stopped | starting | initializing | running | error
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

## Licence

MIT — © 2025 [Alexis Pontikis — Ponti'Com](https://ponticom.fr)
