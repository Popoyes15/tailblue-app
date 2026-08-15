# Brancher le `!update` actuel à la page Nouveautés

Le `main.py` actuel possède déjà le centre de publication `!update` : texte court ou fichier texte, aperçu, mention et publication découpée automatiquement en embeds.

Pour que la Desktop lise exactement les mêmes annonces, la publication réussie doit **aussi écrire un article dans `tailblue_updates.json`**. Le précédent module `tailblue_updates_feed.py` de TailBlue peut rester le registre de cette passerelle.

Principe côté bot après une publication Discord réussie :

```python
from tailblue_updates_feed import record_update_article

record_update_article(
    title=titre_annonce or "Mise à jour de TailBlue",
    body=texte_complet,
    image_urls=images_archivees,
    author_id=ctx.author.id,
    discord_channel_id=channel.id,
)
```

Puis l'API hébergée reçoit le chemin du même JSON :

```env
TAILBLUE_UPDATES_FILE=/chemin/partage/tailblue_updates.json
TAILBLUE_UPDATE_ASSETS_DIR=/chemin/partage/tailblue_updates_assets
```

Résultat :

`!update` → publication Discord → écriture JSON → SSE → page Nouveautés actualisée sans relancer l'application.

Aucun patch automatique de `main.py` n'est appliqué par ce pack : le bot actuel a évolué, donc l'intégration finale doit être faite proprement sur sa version hébergée plutôt que d'écraser du code récent.
