# TailBlue — Paramètres / Notifications / Audio

## Paramètres

Les préférences suivantes sont LOCALES à l'application :

```text
animations
compact
notifications
notificationLevels
sound
ambientMusic
uiSounds
notificationSounds
combatSounds
masterVolume
musicVolume
effectsVolume
```

Elles sont enregistrées dans :

```text
localStorage["tailblue-settings-v2"]
```

Elles ne doivent pas être mises dans `stats.json` : ce sont des préférences
d'interface propres à un appareil.

---

# Notifications

Le backend reste la source des vraies notifications :

```http
GET /api/home
POST /api/home/notifications/{id}/read
POST /api/home/notifications/read-all
GET /api/home/stream
```

Le frontend ajoute localement :

```text
readIds
dismissedIds
```

afin que l'aperçu local et les notifications masquées ne réapparaissent pas à
chaque refresh.

Une future route peut remplacer le masquage local :

```http
POST /api/home/notifications/{id}/dismiss
```

mais ce n'est pas nécessaire pour lancer l'interface.

## Niveaux

```text
info
standard
success
important
urgent
```

Si un type est désactivé dans les paramètres, il est filtré côté application.
Le backend continue de conserver sa notification.

---

# Sons

Emplacements préparés :

```text
public/audio/ambience.mp3
public/audio/ui-click.mp3
public/audio/notification.mp3
public/audio/urgent.mp3
public/audio/combat.mp3
```

Le service vérifie l'existence du fichier avec une requête HEAD.

Si les petits effets sonores ne sont pas encore présents, l'application utilise
un son WebAudio très léger pour permettre de tester les paramètres.

La musique d'ambiance ne démarre qu'après une interaction utilisateur afin de
respecter les restrictions autoplay du moteur WebView.

---

# Combat

`audioService.ts` expose :

```ts
playCombatSound()
```

Mine pourra l'appeler plus tard après une vraie action validée par le backend.

Le son n'a aucune influence sur l'état du combat.

---

# Mode compact

Le mode compact est purement CSS :

```text
html.tb-compact
```

Il réduit notamment :

```text
sidebar
padding dashboard
espacement navigation
espacement panels/cards
```

Aucun composant RPG n'est modifié.

---

# Animations

Animations désactivées :

```text
html.tb-no-animations
```

Toutes les animations/transitions CSS deviennent quasi instantanées.

Les calculs et appels backend restent identiques.
