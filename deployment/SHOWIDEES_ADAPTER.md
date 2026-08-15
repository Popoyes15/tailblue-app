# Adaptateur `idee.py` → Hime Control

Le `main.py` actuel confirme que TailBlue appelle :

```python
enregistrer_commandes_idees(
    bot,
    charger_stats,
    sauver_stats,
    objets_infos=objets_infos,
    hime_id=...
)
```

Le contenu exact du `idee.py` actuel n'était pas accessible lors de la
préparation de ce pack. **Ne remplace pas son stockage à l'aveugle.**

Quand on fera la connexion réelle, il faudra ouvrir `idee.py` et identifier :

1. le fichier/registre où sont stockées les idées ;
2. leur ID stable ;
3. ce que lit actuellement `!showidees` ;
4. les statuts déjà existants éventuels ;
5. comment l'idée implémentée et le trophée royal sont traités ;
6. où sont incrémentés `idees_publiees` / `idees_implementees`.

Puis exposer une couche d'adaptation :

```python
list_ideas_for_hime()
update_idea_for_hime(idea_id, patch)
delete_idea_for_hime(idea_id)
award_implemented_idea(idea_id)
```

Si `idee.py` possède déjà ces fonctions sous un autre nom, les réutiliser.

Les champs purement Desktop (note Hime, priorité, mise en avant, version cible,
tags...) peuvent être enregistrés dans un sidecar sans toucher au format
historique :

```text
tailblue_ideas_admin.json
```

clé = ID stable de l'idée.
