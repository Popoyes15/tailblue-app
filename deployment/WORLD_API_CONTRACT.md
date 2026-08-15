# TailBlue — contrat API Monde

Ce fichier décrit les endpoints que les pages React attendent.
Le frontend ne doit jamais être la source de vérité du gameplay.

## Authentification

L'utilisateur doit être identifié côté serveur (à terme OAuth Discord/session).
Ne jamais accepter un `userId` arbitraire du frontend pour agir sur un autre profil.

## Maison

### GET `/api/world/house`

Retourne `HouseSnapshot`.

Le serveur doit dériver :
- `currentHouseId` depuis la résidence effective (`maison`) ;
- `ownedHouseId` depuis `maison_possedee` ;
- les données de résidence partagée/mariage ;
- le mobilier réel et les bonus réellement actifs.

### POST `/api/world/house/buy`

```json
{ "houseId": "cabane" }
```

Le serveur réutilise les règles Python :
- niveau requis ;
- cookies ;
- maisons non achetables (`sans_abri`, `chateau`) ;
- Hime-sama ;
- `maison_possedee` distinct de `maison` ;
- ne pas déplacer automatiquement le conjoint si une résidence est partagée.

### POST `/api/world/house/furniture`

```json
{ "action": "install", "itemId": "..." }
```

Actions : `buy`, `install`, `store`.

Le serveur vérifie propriété, coût, slots, caps et effets.

## Musée

### GET `/api/world/museum`

Retourne `MuseumSnapshot`.

- `pieces` vient du vrai `musee` du joueur.
- `candidates` vient des objets réellement possédés pouvant être ajoutés.
- la valeur est calculée avec les vraies infos d'objet.
- le type de musée suit `MUSEES_MAISONS`.
- actuellement, `plateau` n'a pas d'entrée dédiée dans `MUSEES_MAISONS` et le Python retombe sur `sans_abri`.

### POST `/api/world/museum/add`

```json
{ "itemName": "Nom exact fourni par l'API" }
```

Le serveur réutilise la logique de `museeadd` :
- vérifier que l'objet existe dans l'inventaire ;
- refuser les doublons ;
- retirer 1 exemplaire ;
- ajouter au musée ;
- sauvegarder ;
- vérifier les succès.

## Marché

### GET `/api/world/market`

Retourne `MarketSnapshot`.

Le serveur dérive :
- étape de reconstruction 0..5 ;
- cookies ;
- nombre d'objets RPG ;
- bâtiments possédés ;
- niveaux d'ateliers 1..6 ;
- coût réel de la prochaine amélioration ;
- prochain bâtiment reconstructible ;
- stock filtré depuis `ITEMS` par bâtiment/niveau ;
- quantités possédées.

### POST `/api/world/market/building/buy`

```json
{ "buildingId": "forge" }
```

Le serveur impose l'ordre de reconstruction et les cookies.

### POST `/api/world/market/building/upgrade`

```json
{ "buildingId": "forge" }
```

Le serveur calcule le coût avec la fonction Python réelle et limite le niveau à 6.

### POST `/api/world/market/transaction`

```json
{
  "buildingId": "forge",
  "itemId": "market_forge_l1_1",
  "mode": "buy",
  "quantity": 1
}
```

Le serveur vérifie :
- bâtiment possédé ;
- item réellement disponible ;
- niveau d'atelier ;
- prix ;
- cookies ;
- quantité possédée lors d'une vente ;
- quantité max autorisée.

## Classement

### GET `/api/world/leaderboard/levels`

Retourne `LeaderboardSnapshot`.

Il doit reproduire `!topniveau` :
1. charger tous les profils ;
2. calculer le niveau depuis l'XP avec `calculer_niveau` ;
3. trier décroissant ;
4. prendre les 10 premiers ;
5. résoudre les noms/avatars Discord côté serveur.

Ne pas envoyer de faux rang d'aventurier tant qu'un classement global officiel correspondant n'existe pas dans le Python.

## Galerie

Aucun endpoint nécessaire.

La Galerie est volontairement locale et purement visuelle :
- maisons ;
- musées ;
- étapes et intérieurs du marché.

Elle ne modifie aucune donnée gameplay.
