# TailBlue — Contrat API Pets / Chenil / Élevage

Le frontend est prêt pour un backend authentifié TailBlue.

## Principes de sécurité

Le frontend n'est jamais l'autorité sur :
- les pets possédés ;
- `pets_actifs` ;
- le nombre de places ;
- le Chenil Royal ;
- les cookies ;
- les achats ;
- les PV / énergie / confiance ;
- les cooldowns de papouille ;
- les goûts alimentaires ;
- l'incubation ;
- le dragon tiré.

Le serveur identifie le joueur via la session/authentification réelle.

---

# 1. Pets

## GET /api/companions

Renvoie :

```json
{
  "catalog": [],
  "owned": []
}
```

`catalog` est sérialisé depuis `PETS` et `DRAGONS`.

Chaque compagnon possédé doit utiliser le helper Python :

```python
get_pet_display_name(stats, user_id, pet_id)
```

afin que les surnoms fonctionnent partout.

`owned` reflète les vraies données de :

```text
player["pets"]
player["pet_data"][pet_id]
player["pets_actifs"]
```

et doit renvoyer :
- niveau ;
- XP ;
- XP niveau suivant ;
- affection/confiance ;
- PV ;
- énergie ;
- image de forme actuelle ;
- statut actif ;
- possibilité de surnom.

## POST /api/companions/{pet_id}/active

Body :

```json
{ "active": true }
```

Le backend doit utiliser la logique réelle de :
- `get_active_pet_ids`
- `limite_active_compagnons`
- compatibilité `player["pet"]`

Il doit refuser l'Œuf des Origines comme compagnon actif.

IMPORTANT :
Le compagnon d'expédition Mine reste indépendant de `pets_actifs`.

## POST /api/companions/{pet_id}/pet

Doit appeler la vraie logique de papouille :
- cooldown 30 min ;
- tempérament ;
- confiance ;
- réactions uniques Taiga/Sugus ;
- éventuelle récupération d'énergie.

## PATCH /api/companions/{pet_id}/nickname

Body :

```json
{ "nickname": "Cocotte" }
```

Doit respecter :
- niveau 10 minimum ;
- 1 à 24 caractères ;
- validation des mentions ;
- sauvegarde dans `pet_data[pet_id]["surnom"]`.

## POST /api/companions/{pet_id}/feed

Body :

```json
{ "foodId": "viande_sechee" }
```

Doit utiliser directement :

```python
nourrir_compagnon(...)
```

Le backend décide :
- présence de la nourriture ;
- préférence ;
- multiplicateur ;
- PV ;
- énergie ;
- découverte du goût ;
- éventuel +1 confiance.

Le Poisson Très Suspect conserve son comportement spécial du bot.

---

# 2. Chenil

## GET /api/kennel

Doit sérialiser :
- `CHENILS_GUILDE`
- `obtenir_chenil_joueur`
- `limite_active_compagnons`
- `capacite_totale_compagnons`
- privilège `royal_tsundere`
- niveau du joueur ;
- guilde réelle ;
- raison de blocage d'une amélioration.

Le Chenil Royal de Tsundere :
- Hime-sama + Sugus ;
- uniquement dans la guilde Tsundere valide ;
- capacité totale infinie ;
- jusqu'à 6 compagnons actifs ;
- ne peut pas être remplacé par un chenil ordinaire.

## POST /api/kennel/upgrade

Body :

```json
{ "kennelId": "forestier" }
```

Le backend doit :
- vérifier niveau 15 ;
- vérifier appartenance à une guilde ;
- refuser les rétrogradations/sauts non permis si le moteur les refuse ;
- vérifier les cookies ;
- refuser le remplacement du Chenil Royal ;
- débiter puis sauvegarder.

Paliers actuels :

```text
Petit Chenil           3'000      +1
Chenil Rustique        7'500      +2
Chenil Forestier      15'000      +3
Chenil du Village     30'000      +4
Grand Refuge          60'000      +5
Domaine              100'000      +6
Prestigieux          175'000      +8
Royal Tsundere             0       ∞
```

---

# 3. Provisions

## GET /api/provisions

Doit sérialiser :
- niveau `pet_provision_level` ;
- `PET_PROVISION_LEVELS` ;
- `stock_provisions(stats, user_id)` ;
- `pet_food_inventory` ;
- cookies actuels ;
- prochaine amélioration.

Chemins actuels :

```text
/Chenils/provisions_niv1.png
/Chenils/provisions_niv2.png
/Chenils/provisions_niv3.png
/Chenils/provisions_niv4.png
/Chenils/provisions_niv5.png
```

Prix des paliers :

```text
1 : 0
2 : 1'000
3 : 1'500
4 : 2'500
5 : 4'000
```

## POST /api/provisions/buy

Body :

```json
{
  "foodId": "ration_simple",
  "quantity": 10
}
```

Doit appeler la logique réelle d'achat.
Ne jamais accepter un prix calculé par React.

## POST /api/provisions/upgrade

Doit appeler la logique équivalente à :

```python
ameliorer_provisions(stats, user_id)
```

---

# 4. Élevage / Œuf des Origines

Le système actuel n'est PAS une reproduction libre.
Il s'agit de l'incubation de l'Œuf des Origines.

## GET /api/breeding

Renvoie :
- présence de `oeuf_origines` ;
- `incubation_work` ;
- `incubation_hunt` ;
- `incubation_daily` ;
- objectifs 15 / 20 / 1 ;
- état `eclos` ;
- état prêt à éclore ;
- les huit lignées de `DRAGONS`.

La progression est déjà alimentée par :

```python
avancer_incubation_oeuf(stats, user_id, activite)
```

avec :
- Work : 15 ;
- Hunt : 20 ;
- Daily : 1.

## POST /api/breeding/hatch

Le backend doit :
1. vérifier que l'œuf appartient au joueur ;
2. vérifier les trois objectifs ;
3. refuser une double éclosion ;
4. reprendre `oeuf_dragon` s'il est déjà figé ;
5. sinon appeler `tirer_dragon()` ;
6. retirer `oeuf_origines` ;
7. retirer les données d'incubation ;
8. ajouter le dragon obtenu ;
9. créer ses `pet_data` ;
10. sauvegarder ;
11. renvoyer le nouveau snapshot.

Le frontend ne tire JAMAIS le dragon.

Poids actuels :

```text
Kagutsuchi   32 %
Hyōrin       24 %
Raijin       18 %
Kodama       12 %
Suijin        7 %
Dokuryū       4 %
Yamikage      2 %
Hikariryū     1 %
```

La future reproduction/lignée reste désactivée tant qu'un moteur Python réel
n'existe pas.


---

# 5. Chroniques / Histoire des compagnons

Le catalogue envoyé par `GET /api/companions` doit inclure :

```json
{
  "story": "..."
}
```

Source Python :

```python
story = pet.get("histoire_complete") or pet.get("histoire")
```

Le frontend affiche cette valeur dans le bouton `📖 Histoire`.

Dans l'UI actuelle du bot, les chroniques du Chenil sont déjà construites
avec exactement cette priorité :

```python
histoire = pet.get("histoire_complete") or pet.get("histoire") or "Aucune chronique connue."
```

Pour respecter la sécurité du système Discord actuel :
- la chronique dans le contexte "mon compagnon" peut être réservée aux pets possédés ;
- le catalogue/bestiaire peut continuer à avoir son propre niveau d'accès si souhaité.

---

# 6. Nourrir dans le Chenil ET dans la Mine

Le même moteur doit être utilisé partout :

```python
nourrir_compagnon(stats, user_id, pet_id, food_id)
```

Il ne faut surtout pas créer une deuxième logique pour l'app.

## Chenil

`POST /api/companions/{pet_id}/feed`

utilise le sac `pet_food_inventory`, applique les goûts, PV, énergie et
confiance, puis sauvegarde.

## Mine

Le snapshot Mine doit renvoyer pour le compagnon d'expédition :

```json
{
  "companion": {
    "id": "sugus_tigre",
    "name": "Sugus",
    "hp": 100,
    "maxHp": 100,
    "energy": 80,
    "maxEnergy": 100,
    "trustLabel": "💞 Lien absolu",
    "availableFoods": [
      {
        "id": "viande_sechee",
        "name": "🥩 Viande séchée",
        "quantity": 2,
        "heal": 12,
        "energy": 13,
        "preference": "adore"
      }
    ],
    "canPet": true
  }
}
```

Les actions Mine deviennent aussi :

```text
pet_feed
pet_cuddle
```

Le backend appelle alors les fonctions existantes de `pets.py`.

IMPORTANT :
- les soins du compagnon ne permettent pas de déplacer le joueur ;
- ils ne doivent pas contourner un combat actif ;
- pendant un combat, les règles du moteur de combat restent prioritaires.
