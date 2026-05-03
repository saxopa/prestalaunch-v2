# PrestaLaunch — Roadmap v2

> Fonctionnalités planifiées pour la prochaine version, inspirées de [LocalWP](https://localwp.com/).

## Priorités v2

| # | Fonctionnalité | Description | Impact | Temps estimé |
|---|---|---|---|---|
| 1 | **One-click PS Admin** | Ouvre le back-office PrestaShop directement connecté (token auto-login) | ⭐⭐⭐ | ~1j |
| 2 | **Xdebug toggle** | Activer/désactiver Xdebug par toggle — rebuild container avec la config PHP | ⭐⭐⭐ | ~1.5j |
| 3 | **Backups** | Export/import base de données + fichiers → archive zip horodatée en local | ⭐⭐⭐ | ~3j |
| 4 | **Live Link (tunnel)** | Exposer le site local via ngrok ou Cloudflare Tunnel pour démos client | ⭐⭐⭐ | ~2j |
| 5 | **Changement de domaine** | Modifier le domaine d'un site existant (Docker + mise à jour DB PrestaShop) | ⭐⭐⭐ | ~2j |

## Features complémentaires

| Fonctionnalité | Description | Impact | Temps estimé |
|---|---|---|---|
| **Groupes de sites** | Organiser les sites par client/projet (dossiers/tags) | ⭐⭐ | ~1j |
| **Onglet Database** | Vue des tables, import/export SQL sans passer par PhpMyAdmin | ⭐⭐ | ~2.5j |
| **Onglet Tools** | Raccourcis `php bin/console`, cache clear, install module PS | ⭐⭐⭐ | ~2j |
| **Changement PHP à chaud** | Dropdown pour changer la version PHP sur un site existant | ⭐⭐ | ~2j |
| **Sites favoris** | Épingler des sites en haut de liste | ⭐ | ~3h |
| **Last started** | Horodatage du dernier démarrage affiché sur la carte | ⭐ | ~2h |

## Réservé v3

| Fonctionnalité | Description | Raison du report |
|---|---|---|
| **Pull / Push** | Synchronisation bidirectionnelle avec un serveur distant (FTP/SSH + dump SQL) | Complexité élevée — mapping chemins, credentials SSH, gestion conflits |

---

*Roadmap établie le 2026-05-03 — [Ponti'Com](https://ponticom.fr) × PrestaLaunch*
