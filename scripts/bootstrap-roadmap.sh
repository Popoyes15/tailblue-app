#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-Popoyes15/tailblue-app}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) n'est pas installé."
  echo "Sur macOS : brew install gh"
  exit 1
fi

gh auth status >/dev/null 2>&1 || {
  echo "Connecte d'abord GitHub CLI : gh auth login"
  exit 1
}

echo "Création / mise à jour des labels Roadmap dans $REPO..."

gh label create "roadmap" --repo "$REPO" --color "1D76DB" --description "Visible sur la Roadmap publique TailBlue" --force
gh label create "status:doing" --repo "$REPO" --color "0E8A16" --description "Travail actuellement en cours" --force

gh label create "phase:fondations" --repo "$REPO" --color "5319E7" --description "Fondations de TailBlue" --force
gh label create "phase:aventure" --repo "$REPO" --color "0052CC" --description "Aventure et combat" --force
gh label create "phase:backend" --repo "$REPO" --color "D93F0B" --description "Backend réel" --force
gh label create "phase:distribution" --repo "$REPO" --color "FBCA04" --description "Distribution desktop" --force
gh label create "phase:royaume" --repo "$REPO" --color "B60205" --description "Évolution future du royaume" --force

create_issue_if_missing() {
  local title="$1"
  local phase="$2"
  local status="${3:-todo}"

  local existing
  existing="$(gh issue list \
    --repo "$REPO" \
    --state all \
    --search "\"$title\" in:title" \
    --json title \
    --jq ".[] | select(.title == \"$title\") | .title" \
    | head -n 1 || true)"

  if [[ "$existing" == "$title" ]]; then
    echo "Existe déjà : $title"
    return
  fi

  local labels="roadmap,$phase"
  if [[ "$status" == "doing" ]]; then
    labels="$labels,status:doing"
  fi

  local issue_url
  issue_url="$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "Élément de la Roadmap publique TailBlue." \
    --label "$labels")"

  echo "Créée : $title"

  if [[ "$status" == "done" ]]; then
    local issue_number
    issue_number="${issue_url##*/}"
    gh issue close "$issue_number" --repo "$REPO" --reason completed
    echo "Fermée automatiquement : $title"
  fi
}

# Fondations
create_issue_if_missing "Application desktop Tauri / React" "phase:fondations" "done"
create_issue_if_missing "Connexion Discord et identité joueur" "phase:fondations" "done"
create_issue_if_missing "Navigation, profils et interface principale" "phase:fondations" "done"
create_issue_if_missing "Site public TailBlue et page de téléchargement" "phase:fondations" "doing"

# Aventure
create_issue_if_missing "Exploration de la Mine" "phase:aventure" "done"
create_issue_if_missing "Combats et effets visuels" "phase:aventure" "done"
create_issue_if_missing "Compagnons en combat" "phase:aventure" "done"
create_issue_if_missing "Découverte progressive et nouvelles zones" "phase:aventure" "doing"

# Backend
create_issue_if_missing "API TailBlue publique sécurisée" "phase:backend" "doing"
create_issue_if_missing "Pets, équipement, craft et maisons" "phase:backend" "doing"
create_issue_if_missing "Guildes, quêtes et marché" "phase:backend" "todo"
create_issue_if_missing "Temps réel SSE / WebSocket" "phase:backend" "todo"

# Distribution
create_issue_if_missing "Téléchargement Alpha macOS" "phase:distribution" "doing"
create_issue_if_missing "Session Discord persistante" "phase:distribution" "todo"
create_issue_if_missing "Mises à jour automatiques" "phase:distribution" "todo"
create_issue_if_missing "Build Windows" "phase:distribution" "todo"

# Royaume
create_issue_if_missing "Nouvelles quêtes et événements" "phase:royaume" "todo"
create_issue_if_missing "Mariage et résidence royale" "phase:royaume" "todo"
create_issue_if_missing "Conquêtes et nouvelles zones" "phase:royaume" "todo"
create_issue_if_missing "Évolution communautaire du royaume" "phase:royaume" "todo"

echo
echo "Les tâches déjà terminées ont été fermées automatiquement."
echo "Ensuite, dans Settings > Pages, choisis Source : GitHub Actions."
