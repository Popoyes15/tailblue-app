# TailBlue — Personnage Final : contrat backend

## Objectif

La page `Personnage` est une vue READ-ONLY du personnage authentifié.

Le frontend n'envoie jamais un Discord ID pour décider de l'identité.

La session serveur résout le `discord.Member`, puis le backend lit les données
du bot.

---

# Routes

## Résumé

```http
GET /api/character
```

Renvoie :

```text
profil Discord
niveau / XP
rang d'aventurier
stats de combat actives
résumés Race / Métier / Guilde / Résidence / Compagnon / Équipement
compteurs d'activité
```

## Détails chargés au clic

```http
GET /api/character/details/race
GET /api/character/details/job
GET /api/character/details/guild
GET /api/character/details/residence
GET /api/character/details/companion
GET /api/character/details/rank
GET /api/character/details/equipment
```

Cela évite de charger toutes les archives de guilde / skills / membres à chaque
affichage de la page.

## Temps réel

```http
GET /api/character/stream
```

SSE events :

```text
character
profile
equipment
guild
companion
```

Le frontend relit ensuite les routes serveur. React ne devient jamais
la source de vérité.

---

# Profil Discord

À partir de la session authentifiée :

```python
display_name = member.display_name
avatar_url = member.display_avatar.url
```

Même avatar à réutiliser partout dans l'app.

---

# Niveau général

```python
xp_total = int(player.get("xp", 0) or 0)
niveau, xp_actuel, xp_necessaire = infos_niveau(xp_total)
```

Ne pas recalculer dans React.

---

# Rang d'aventurier

Avant sérialisation :

```python
resultat, changed = _sync_adventurer_rank(member, player)

if resultat is not None:
    rank = resultat.rank
    score = resultat.score
else:
    rank = player.get("rang_aventurier")
    score = player.get("rang_aventurier_score")

if changed:
    sauver_stats(stats)
```

L'échelle actuelle :

```text
F → E → D → C → B → A → S → SS → SSS
```

Le frontend affiche `—` si aucune valeur réelle n'est fournie.

---

# Combat / équipement

Utiliser les mêmes fonctions que `equipment.py` :

```python
equipment_map = normalize_equipment(
    player.get("equipement", player.get("equipment", {}))
)

race = get_player_race(player)
preferred_weapons = race.preferred_weapons if race else ()

total_stats = calculate_equipment_stats(
    equipment_map,
    base_stats=BASE_PLAYER_STATS,
    weapon_masteries=player.get(
        "weapon_masteries",
        player.get("maitrises_armes"),
    ),
    favorite_weapon_families=preferred_weapons,
)
```

Pour la fiche détaillée équipement, utiliser aussi :

```python
get_equipment_calculation_details(...)
```

Emplacements existants :

```text
weapon
helmet
chest
gloves
leggings
boots
ring
amulet
```

Ne jamais dupliquer les règles de statistiques dans TypeScript.

---

# Race

Source :

```python
race = get_player_race(player)
```

Données déjà présentes dans `RaceDefinition` :

```text
id
name
emoji
description
archetype
elements
preferred_weapons
stat_bonuses
base_skills
exclusive_user_id
aliases
image_url
```

Compétences :

```python
get_unlocked_race_skills(player)
get_pending_skill_levels(player)
```

Image :

```python
RACE_IMAGE_PATHS[race.id]
```

Puis convertir en URL publique :

```text
/ImagesRaces/elfe.png
/ImagesRaces/frieren.png
...
```

### Lore futur

`showstart` annonce une origine, un royaume et une histoire unique pour chaque
race, mais les champs séparés ne sont pas encore présents dans le
`RaceDefinition` actuel.

Le contrat frontend prévoit déjà :

```json
{
  "origin": null,
  "kingdom": null,
  "history": null
}
```

Quand tu souhaiteras enrichir le moteur, ajouter ces champs à la définition
Python. L'app les affichera automatiquement.

**Ne pas inventer ce lore côté React.**

### Note image Kitsune

Le dépôt public possède :

```text
public/ImagesRaces/kitsune.png
```

alors qu'une version de `RACE_IMAGE_PATHS` contient :

```text
ImagesRaces/kistune.png
```

Corriger le chemin Python à la phase backend afin que le serveur expose
l'image réellement existante.

---

# Métier

Pour Hime-sama, le système `work` force actuellement :

```python
metier = "princesse"
```

Pour les autres :

```python
metier = player.get("job")
```

Source de présentation :

```python
JOBS[metier]
CODEX_METIERS[metier]
```

Le détail peut sérialiser :

```text
nom
niveau requis
description
salaire de référence
spécialité
citation
```

Si un métier n'a pas d'image aujourd'hui, `imageUrl = null`.
Ne pas inventer une illustration.

---

# Guilde

Trouver la guilde avec la fonction actuelle :

```python
nom_guilde = trouver_guilde_joueur(guildes, str(member.id))
```

Détails :

```text
fondateur
niveau
xp
tresor
membres
max_membres
hall_level
hall_xp
```

XP suivante actuelle :

```python
xp_needed = niveau * 100
```

Image :

```python
obtenir_image_guilde(guilde)
```

Images existantes :

```text
/ImagesGuildes/guilde_standard.png
/ImagesGuildes/guilde_avancee.png
/ImagesGuildes/guilde_prestige.png
/ImagesGuildes/guilde_legendaire.png
/ImagesGuildes/guilde_Hime.png
```

Hall :

```python
hall_info = obtenir_hall(guilde, str(member.id))
```

Images :

```text
/hall/campement.png
/hall/refuge.png
/hall/pavillon.png
/hall/forteresse.png
/hall/domaine.png
/hall/citadelle.png
/hall/imperial.png
```

Les noms des membres et avatars doivent être résolus côté serveur, jamais par
le frontend.

---

# Résidence

Déterminer d'abord la résidence EFFECTIVE du personnage côté serveur.

Pour Hime-sama :

```python
house_id = "chateau"
```

Pour les autres, respecter les règles actuelles et, plus tard, la règle de
résidence effective du mariage/château.

Données :

```python
HOUSES[house_id]
MAISON_EFFETS[house_id]
```

Image exemple :

```text
/ImagesMaison/Image_Chateau.png
```

Le frontend ne décide pas si quelqu'un a droit au Château.

---

# Compagnon

Source `pets.py` :

```python
active_ids = get_active_pet_ids(stats, member.id)
pet_id = active_ids[0] if active_ids else None

definition = get_pet_definition(pet_id)
display_name = get_pet_display_name(stats, member.id, pet_id)
pet_data = player.get("pet_data", {}).get(pet_id, {})
```

Pour enrichir la fiche :

```python
get_pet_stats(...)
get_pet_capacites(...)
relation_compagnon(...)
```

Histoire :

```python
definition.get("histoire_complete")
or definition.get("histoire")
```

Utiliser la fonction d'image selon le niveau/évolution déjà utilisée par
`pets.py`, pas une URL reconstruite arbitrairement.

---

# Activité

Les compteurs existent déjà dans le profil :

```text
cookies
donnes
recus
coffres_ouverts_total
travaux_effectues
chasses
reputation
succes
musee
```

Exemple :

```python
activity = {
    "cookies": int(player.get("cookies", 0) or 0),
    "hugsGiven": int(player.get("donnes", 0) or 0),
    "hugsReceived": int(player.get("recus", 0) or 0),
    "chestsOpened": int(player.get("coffres_ouverts_total", 0) or 0),
    "works": int(player.get("travaux_effectues", 0) or 0),
    "hunts": int(player.get("chasses", 0) or 0),
    "reputation": int(player.get("reputation", 0) or 0),
    "successes": len(player.get("succes", []) or []),
    "museumPieces": len(player.get("musee", []) or []),
}
```

---

# Sécurité

Toutes ces routes nécessitent une session Discord authentifiée.

- pas de `user_id` fourni par React ;
- pas de changement de race/métier/guilde depuis ce GET ;
- aucune règle Hime dans le frontend ;
- les données privées de guilde ne sont renvoyées qu'aux sessions autorisées ;
- les images sont des assets publics ou des URLs Discord autorisées ;
- CORS limité aux origines de l'app/web TailBlue.
