# TailBlue — Inventaire + !equipment + !craft

## Principe

Les trois onglets de l'app utilisent exactement la même source de vérité :

```python
stats[user_id]["inventaire_equipement"]
```

C'est déjà l'inventaire RPG partagé par `equipment.py`, `craft.py`, `mine.py`
et `items.py`.

Le frontend ne stocke jamais une copie autoritaire.

---

# 1. GET /api/inventory

Résout le membre Discord depuis la session serveur.

Puis :

```python
stats = charger_stats()
player = stats[str(member.id)]

inventory = get_player_rpg_inventory(
    player,
    create=True,
    fallback_to_legacy=True,
)
```

Le serveur sérialise uniquement les entrées `ITEMS[item_id]` réellement
possédées.

Réponse :

```text
items
equipment
craft
mode = "api"
generatedAt
```

---

# 2. Équipement

Le système actuel possède 8 emplacements :

```text
weapon     ⚔️ Arme
helmet     🪖 Casque
chest      🥋 Plastron
gloves     🧤 Gants
leggings   👖 Jambières
boots      🥾 Bottes
ring       💍 Anneau
amulet     📿 Amulette
```

## POST /api/inventory/equipment/equip

Body :

```json
{
  "itemId": "frieren_scepter"
}
```

Côté serveur :

```python
inventory = get_player_rpg_inventory(
    player,
    create=True,
    fallback_to_legacy=True,
)

equipment_map = normalize_equipment(
    player.get("equipement", player.get("equipment", {}))
)

level = infos_niveau(int(player.get("xp", 0) or 0))[0]

equip_item(
    equipment_map,
    item_id,
    player_level=level,
    inventory=inventory,
)

player["equipement"] = equipment_map
sauver_stats(stats)
```

**Ne jamais accepter le slot ou les stats envoyés par React.**
`equip_item()` valide l'objet, sa possession, son emplacement et le niveau.

## POST /api/inventory/equipment/unequip

Body :

```json
{
  "slot": "weapon"
}
```

Serveur :

```python
slot = EquipmentSlot(body.slot)
equipment_map = normalize_equipment(...)
previous = unequip_slot(equipment_map, slot)

if previous is None:
    HTTP 400

player["equipement"] = equipment_map
sauver_stats(stats)
```

## Statistiques actives

Même calcul que Discord/combat :

```python
race = get_player_race(player)

calculate_equipment_stats(
    equipment_map,
    base_stats=BASE_PLAYER_STATS,
    weapon_masteries=player.get(
        "weapon_masteries",
        player.get("maitrises_armes"),
    ),
    favorite_weapon_families=(
        race.preferred_weapons if race else ()
    ),
)
```

Le frontend ne somme jamais les statistiques.

---

# 3. Artisanat / !craft V5

`craft.py V5` est le moteur.

Il doit rester la seule autorité pour :

```text
recettes accessibles
recettes découvertes
recettes inconnues
niveaux d'atelier
compatibilité du joueur
matériaux manquants
cookies nécessaires
plans
quantité maximale
fabrication
nouveaux objets
nouvelles recettes découvertes
craft_total
craft_par_objet
```

## GET /api/inventory/craft/recipe/{item_id}

Utiliser :

```python
data = repository.load_player(member.id)
state = recipe_state(item_id, data)
item = ITEMS[item_id]
```

Renvoyer :

```text
known
hidden
name / emoji / rareté si connu
workshop
workshopLevel
activeWorkshopLevel
craftable
maxQuantity
materials[]
goldCost
raceFitText
requiredPlan
stats / effects
```

Si `known == False` :

```text
name = "??????"
description = null
materials = []
```

Ne pas révéler les composants d'une recette inconnue.

## POST /api/inventory/craft

Body :

```json
{
  "itemId": "explorer_torch",
  "quantity": 12
}
```

Serveur :

```python
data, produced, discoveries = await repository.craft(
    member.id,
    item_id,
    quantity,
)
```

**Il ne faut pas appeler `craft_item()` directement depuis la route**
si cela contourne `CraftRepository.craft()`, car le repository gère :

```text
verrou utilisateur
validation recette connue
MAX_BATCH_CRAFT = 100
quantité réellement possible
inventaire
cookies
statistiques d'artisanat
découvertes post-fabrication
sauvegarde
```

Après fabrication, renvoyer un snapshot complet `/api/inventory`
rafraîchi.

---

# 4. Catégories actuelles du craft

Le backend doit idéalement sérialiser les constantes de `craft.py`
au lieu de les dupliquer :

```text
📚 Toutes
⚔️ Armes
🔥 Forgeables
🧪 Alchimie
🛡️ Protections
⛏️ Outils
🧪 Consommables
🎒 Utilitaires
```

Filtres actuels :

```text
📋 Toutes
📜 Découvertes
✅ Fabricables
📦 Incomplètes
❔ Inconnues
```

Sous-catégories :

```python
SUBCATEGORIES_BY_CATEGORY
```

L'app sait déjà les afficher.

Si `craft.py` ajoute une catégorie plus tard, l'API peut la renvoyer et
l'interface n'a pas besoin de changer.

---

# 5. Ateliers

`all_recipe_ids()` utilise actuellement les niveaux d'ateliers du profil.

Le catalogue peut donc contenir :

```text
Workshop.CRAFT
Workshop.FORGE
Workshop.ALCHEMIST
```

selon les bâtiments reconstruits / niveaux disponibles.

L'app ne débloque jamais une recette elle-même.

---

# 6. Découverte automatique

Le système actuel utilise :

```python
discover_recipes_from_inventory(
    inventory,
    known_plans,
)
```

Les recettes découvertes sont enregistrées dans :

```python
player["recettes_connues"]
```

Une recette inconnue reste affichée sous la forme :

```text
❔ ??????
Réunis ses matériaux pour révéler sa fabrication.
```

---

# 7. Quantité

Le moteur actuel limite :

```python
MAX_BATCH_CRAFT = 100
```

Le maximum dépend aussi des matériaux, du coût en cookies et du caractère
stackable/non-stackable.

L'app propose :

```text
-10
-1
+1
+10
Max
Fabriquer xN
```

mais le serveur revalide TOUJOURS la quantité au clic.

---

# 8. Race / équipements exclusifs

`craft.py` utilise déjà `get_player_race()` et sa logique
`item_allowed_for_player()`.

Par exemple le Sceptre de Frieren est réservé par les règles Python.

Le frontend peut afficher `raceFitText`, mais ne doit jamais autoriser lui-même
un craft réservé.

---

# 9. SSE / temps réel

```http
GET /api/inventory/stream
```

Événements :

```text
inventory
equipment
craft
```

Quand Discord exécute `!equipement`, `!craft`, Mine, Hunt, Work, Marché, etc.,
le backend émet un événement et l'application relit `/api/inventory`.

Aucun redémarrage Tauri requis.

---

# 10. Sécurité

- session Discord serveur obligatoire ;
- aucun `user_id` provenant de React ;
- prix/stats/slots/recettes jamais acceptés depuis le client ;
- équipement validé par `equip_item()` ;
- déséquipement validé par `unequip_slot()` ;
- fabrication validée par `CraftRepository.craft()` ;
- sauvegarde uniquement côté Python ;
- actions sérialisées/verrouillées pour éviter les doubles clics.
