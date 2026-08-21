TAILBLUE — ROADMAP AUTO ONLY

CE PACK NE CONTIENT PAS LE DOSSIER docs/.
Il ne modifie donc PAS :
- tes pages HTML actuelles
- les boutons que tu as supprimés
- tes images favicon.png
- ton CSS
- ton JavaScript du site

À copier à la RACINE de ~/tailblue-app :

.github/
  workflows/
    pages.yml

scripts/
  build-roadmap.mjs
  bootstrap-roadmap.sh

Le workflow :
1. lit les Issues GitHub portant le label `roadmap`
2. génère automatiquement docs/roadmap.json
3. publie ensuite TON dossier docs/ actuel sur GitHub Pages

IMPORTANT :
Ta page roadmap.html doit déjà charger ./roadmap.json.
C'est le cas de la version multipages TailBlue préparée précédemment.

Ensuite :
cd ~/tailblue-app
bash scripts/bootstrap-roadmap.sh

Puis :
git add .github scripts docs
git commit -m "Active GitHub Pages et la roadmap automatique"
git push origin main

Enfin :
GitHub > tailblue-app > Settings > Pages
Source : GitHub Actions
