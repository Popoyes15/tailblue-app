# TailBlue — Contrat API Accueil / Topbar

Le frontend final utilise :

```http
GET /api/home
```

La session Discord est résolue côté serveur.

**React ne doit jamais envoyer un Discord ID comme preuve d'identité.**

## Niveau / XP

Le profil Discord réel utilise :

```python
xp_total = int(profile.get("xp", 0) or 0)
niveau, xp_actuel, xp_necessaire = infos_niveau(xp_total)
```

Le frontend ne recalcule pas le niveau.

## Cookies / "Or"

```python
cookies = int(profile.get("cookies", 0) or 0)
```

La carte visuelle "Or" affiche donc les vrais cookies TailBlue.

## Rang d'aventurier

Avant sérialisation :

```python
result, changed = _sync_adventurer_rank(member, profile)
if changed:
    sauver_stats(stats)
```

Puis :

```text
profile["rang_aventurier"]
profile["rang_aventurier_score"]
```

Sans backend, l'app garde `—`.

## Identité Discord

```python
display_name = member.display_name
avatar_url = member.display_avatar.url
```

Même avatar pour topbar/sidebar/profil/combat/classement.

## Quêtes

Réutiliser :

```python
init_quest_user(stats, member.id)
_quest_refresh_state(profile)
```

Le système V2 fournit 3 offres quand aucune quête n'est active.

## Compagnon

Réutiliser :

```python
active_ids = get_active_pet_ids(stats, member.id)
pet_id = active_ids[0] if active_ids else None

definition = get_pet_definition(pet_id)
display_name = get_pet_display_name(stats, member.id, pet_id)
combat = get_pet_combat_profile(pet_id)
```

Données personnelles dans :

```python
profile["pet_data"][pet_id]
```

## PV / énergie

Réutiliser l'état Mine :

```python
state = MINE_ENGINE.economy.get_state(member.id)
```

Le frontend ne calcule pas les PV/énergie.

# Cloche / notifications

Routes :

```http
POST /api/home/notifications/{id}/read
POST /api/home/notifications/read-all
```

Le bot possède déjà `_envoyer_notification_quete_terminee(...)`.

Pour la cloche Desktop, conserver les notifications dans un petit registre
persistant, par exemple `tailblue_notifications.json`.

Niveaux UI :

```text
info       blanc
standard   bleu
success    vert
important  orange
urgent     rouge
```

# Journal récent

Le bot n'a pas encore un ledger global fiable.

Ne pas fabriquer un historique à partir de compteurs.
Ajouter plus tard un registre d'événements réels, sinon renvoyer `[]`.

# Hime

`/api/home` peut aussi agréger :

```json
{
  "hime": {
    "ideas": 8,
    "errors": 1
  }
}
```

uniquement pour une session Hime autorisée.

# Temps réel

```http
GET /api/home/stream
```

SSE :

```text
home
profile
notification
```

À chaque changement Discord/jeu, l'app relit `/api/home`.
