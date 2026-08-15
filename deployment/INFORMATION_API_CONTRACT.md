# TailBlue — contrat API Informations

## Variables frontend

```env
VITE_TAILBLUE_API_URL=https://ton-api-hebergee.example
VITE_TAILBLUE_ENABLE_LIVE_INFO=true
```

En développement, sans API, les pages Nouveautés et Roadmap montrent un **aperçu développeur explicitement étiqueté**.
En build production, aucune fausse donnée n'est utilisée : si l'API est absente, l'interface affiche un état hors ligne.

## GET /api/updates

Réponse :

```json
{
  "updates": [
    {
      "id": "update-...",
      "title": "Titre",
      "body": "Texte complet",
      "excerpt": "Résumé",
      "published_at": "2026-08-15T00:00:00+02:00",
      "image_urls": ["/api/update-assets/image.png"],
      "tag": "Mise à jour",
      "author": "Hime-sama",
      "importance": "standard"
    }
  ]
}
```

`importance` accepte `info`, `standard`, `important`, `urgent`, `success`.

## GET /api/roadmap

```json
{
  "updated_at": "2026-08-15T00:00:00+02:00",
  "items": [
    {
      "id": "shared-api",
      "status": "current",
      "title": "API TailBlue partagée",
      "description": "...",
      "area": "Backend",
      "progress": 50,
      "target": "V1"
    }
  ]
}
```

Statuts : `done`, `current`, `next`, `later`, `paused`.

## GET /api/information/stream — facultatif

SSE :

```text
data: {"type":"updates"}

data: {"type":"roadmap"}
```

Quand `VITE_TAILBLUE_ENABLE_LIVE_INFO=true`, l'app écoute ce flux et recharge immédiatement la partie concernée. Sans SSE, elle possède aussi un polling de secours (30 s pour les nouveautés, 60 s pour la roadmap).

## Sécurité

Ces routes sont en lecture. Toute future route permettant de créer/modifier une annonce ou la roadmap doit être protégée côté backend avec l'identité Discord vérifiée. Ne jamais faire confiance à un ID ou un rôle envoyé par React.
