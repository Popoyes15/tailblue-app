# TailBlue — Hime Control : contrat d'intégration

## Sécurité absolue

Le frontend peut masquer Hime Control, mais cela **n'est jamais** une sécurité.
Chaque route `/api/hime/*` doit vérifier côté serveur la session Discord et
l'autorisation Hime. React ne doit jamais envoyer un ID Discord comme preuve.

## Sources réelles déjà présentes dans TailBlue

Le `main.py` actuel possède déjà le registre `tailblue_server_activity.json`,
les calculs jour/semaine/mois, les tops commandes/joueurs, `!statsserveur`,
`!serveurs`, `!infoserveur`, `!quitterserveur`, et initialise le Gardien via
`setup_tailblue_guardian(...)`.

Le système d'idées est enregistré par `enregistrer_commandes_idees(...)`.
Le backend doit donc **adapter** ces moteurs au lieu de réinventer leur logique.

## Routes préparées

```text
GET    /api/hime/dashboard
GET    /api/hime/badges
GET    /api/hime/stats?period=today|week|month
GET    /api/hime/ideas
PATCH  /api/hime/ideas/{id}
DELETE /api/hime/ideas/{id}
POST   /api/hime/ideas/{id}/award-trophy
POST   /api/hime/ideas/{id}/announcement
GET    /api/hime/logs
GET    /api/hime/errors
PATCH  /api/hime/errors/{id}
GET    /api/hime/security
POST   /api/hime/security/guilds/{id}/leave
GET    /api/hime/players
GET    /api/hime/players/{id}
POST   /api/hime/players/{id}/action
GET    /api/hime/economy
GET    /api/hime/system
POST   /api/hime/system/backup
GET    /api/hime/stream
```

## Badges de sidebar

Réponse attendue :

```json
{ "ideas": 8, "errors": 1, "total": 9 }
```

Le hook `src/hooks/useHimeBadges.ts` est prêt pour remplacer les compteurs
codés en dur dans la sidebar.

## ShowIdées

Statuts préparés :

```text
submitted    Nouvelle
review       À étudier
accepted     Retenue
in_progress  En cours
implemented  Implémentée
declined     Refusée
archived     Archivée
```

Métadonnées d'administration : priorité, mise en avant, Coup de cœur royal,
note privée Hime, version cible, tags, état du trophée, état du brouillon
Nouveautés et historique.

`featured` peut être vrai sur plusieurs idées. `royalSpotlight` doit être
unique côté serveur : si une idée devient Coup de cœur royal, les autres sont
remises à `false`.

### Trophée

`POST /ideas/{id}/award-trophy` ne peut fonctionner que si l'idée est
`implemented`. Le backend doit réutiliser le mécanisme actuel d'idée/trophée,
ne jamais créer l'objet dans React, et refuser une deuxième remise.

### Passerelle Nouveautés

`POST /ideas/{id}/announcement` crée seulement un **brouillon**. Hime conserve
la main sur le texte et la publication finale.

### Archivage vs suppression

Archiver conserve la trace. DELETE est une suppression définitive et le
frontend demande confirmation.

## Joueurs

Actions préparées :

```text
give_cookies
give_xp
give_reputation
royal_gift
reset_daily
reset_work
reset_hunt
reset_coffer
```

Le serveur doit réutiliser les fonctions métier des commandes Hime existantes.

## Économie

Peut calculer immédiatement depuis les vraies données : somme des cookies,
moyenne, médiane, top fortunes, trésors de guildes, étape du marché,
taxes/grogne si réellement présents.

Les historiques `sourceTotals` / `sinkTotals` doivent rester `null` tant qu'un
vrai registre de transactions n'existe pas. Pas de reconstitution fictive.

## Temps réel

`GET /api/hime/stream` peut être un flux SSE. Le frontend écoute déjà :

```text
dashboard stats ideas logs errors security players economy system
```

Une nouvelle idée reçue par Discord peut donc émettre `event: ideas` et être
visible dans l'application ouverte sans relance.
