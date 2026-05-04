# PrestaLaunch

> Crée et gère des sites PrestaShop locaux en quelques clics — sans ligne de commande.

[![Télécharger](https://img.shields.io/github/v/release/saxopa/prestalaunch-v2?label=Télécharger%20v0.1.1&color=4f46e5&style=for-the-badge)](https://github.com/saxopa/prestalaunch-v2/releases/latest)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## Télécharger

**→ [Dernière version](https://github.com/saxopa/prestalaunch-v2/releases/latest)**

| Système | Fichier |
|---|---|
| macOS Apple Silicon (M1 / M2 / M3 / M4) | `PrestaLaunch_*_aarch64.dmg` |
| macOS Intel | `PrestaLaunch_*_x64.dmg` |
| Windows | `PrestaLaunch_*_x64-setup.exe` |

> **Seul prérequis :** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé.

### Installation macOS

1. Ouvrez le `.dmg` et glissez **PrestaLaunch** dans **Applications**
2. Première ouverture : **clic droit → Ouvrir** (l'app n'est pas signée Apple — c'est normal)
3. Cliquez **Ouvrir** dans la fenêtre de confirmation
4. C'est tout — Docker et PrestaShop se configurent automatiquement

---

## Fonctionnalités

- **Créer un site PrestaShop** en quelques clics — version PS, PHP et MySQL au choix
- **Démarrer / Arrêter** les conteneurs en un clic
- **HTTPS local** via mkcert — s'installe automatiquement depuis les Réglages
- **phpMyAdmin** intégré par site
- **Mailpit** — intercepte les e-mails sortants pour les tester sans les envoyer
- **Logs en temps réel** des conteneurs
- **Ouvrir dans** Finder, VS Code ou Terminal
- **Suppression propre** — conteneurs, volumes et `/etc/hosts` nettoyés en un clic
- **Templates** prédéfinis et personnalisables

---

## Développement

**Prérequis :** [Rust](https://rustup.rs) · [Node.js 20+](https://nodejs.org) · [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone https://github.com/saxopa/prestalaunch-v2.git
cd prestalaunch-v2
npm install
npm run tauri dev
```

Stack : **Tauri v2** · **React 19** · **Rust** · **SQLite** · **Docker Compose**

---

## Licence

MIT — © 2025 [Alexis Pontikis — Ponti'Com](https://ponticom.fr)
