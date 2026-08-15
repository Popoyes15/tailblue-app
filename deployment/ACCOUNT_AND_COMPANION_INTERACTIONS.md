# TailBlue — Compagnon agrandi + Compte Discord

## Compagnon

Aucun nouvel endpoint n'est nécessaire.

La visionneuse utilise simplement :

```text
GET /api/home
home.companion.imageUrl
home.companion.displayName
home.companion.speciesName
```

L'image est affichée entière avec `object-fit: contain`.

## Compte Discord

`GET /api/home` fournit déjà :

```json
{
  "profile": {
    "id": "247052020358447104",
    "displayName": "Hime-sama",
    "avatarUrl": "https://cdn.discordapp.com/...",
    "level": 42,
    "adventurerRank": "S",
    "isHime": true
  }
}
```

Le frontend affiche ces données en lecture seule.

### Déconnexion

```http
POST /api/auth/logout
```

Cette route doit :

1. invalider la session TailBlue côté serveur ;
2. supprimer/invalider le cookie de session ;
3. répondre `204 No Content` ou `200`;
4. ne jamais dépendre d'un Discord ID fourni par React.

Après succès, l'application recharge son état et retourne au flux de connexion.

En mode aperçu local, le bouton Déconnexion reste désactivé.
