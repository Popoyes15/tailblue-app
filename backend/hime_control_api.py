"""TailBlue — squelette de contrat API pour Hime Control.

À garder pour la phase backend. Ce fichier ne remplace ni main.py, ni idee.py,
ni tailblue_guardian.py. Les routes restent volontairement en 501 tant que les
adaptateurs vers les vrais moteurs TailBlue ne sont pas branchés.
"""
from __future__ import annotations

from typing import Any

try:
    from fastapi import APIRouter, Depends, HTTPException
except Exception:  # pragma: no cover - fichier de préparation
    APIRouter = None
    Depends = None
    HTTPException = RuntimeError


def require_hime_session() -> dict[str, Any]:
    """À remplacer par la vraie session Discord côté serveur.

    Ne JAMAIS accepter un Discord ID envoyé par React comme preuve d'identité.
    """
    raise NotImplementedError("Brancher d'abord l'authentification Discord serveur.")


def create_hime_router():
    if APIRouter is None:
        raise RuntimeError("FastAPI n'est pas installé.")

    router = APIRouter(prefix="/api/hime", tags=["Hime Control"])

    def todo(message: str):
        raise HTTPException(status_code=501, detail=message)

    @router.get("/dashboard")
    async def dashboard(_session=Depends(require_hime_session)):
        return todo("Brancher le bilan TailBlue réel.")

    @router.get("/badges")
    async def badges(_session=Depends(require_hime_session)):
        return todo("Brancher idées actives + erreurs ouvertes.")

    @router.get("/stats")
    async def stats(period: str = "week", _session=Depends(require_hime_session)):
        return todo("Réutiliser tailblue_server_activity.json et la logique actuelle de main.py.")

    @router.get("/ideas")
    async def ideas(_session=Depends(require_hime_session)):
        return todo("Brancher le vrai registre de idee.py.")

    @router.patch("/ideas/{idea_id}")
    async def patch_idea(idea_id: str, payload: dict[str, Any], _session=Depends(require_hime_session)):
        return todo("Brancher idee.py + métadonnées Hime.")

    @router.delete("/ideas/{idea_id}")
    async def delete_idea(idea_id: str, _session=Depends(require_hime_session)):
        return todo("Brancher la suppression définitive d'une idée.")

    @router.post("/ideas/{idea_id}/award-trophy")
    async def award_trophy(idea_id: str, _session=Depends(require_hime_session)):
        return todo("Réutiliser le vrai mécanisme de trophée d'idée TailBlue.")

    @router.post("/ideas/{idea_id}/announcement")
    async def idea_announcement(idea_id: str, _session=Depends(require_hime_session)):
        return todo("Créer uniquement un brouillon dans le flux Nouveautés.")

    @router.get("/logs")
    async def logs(_session=Depends(require_hime_session)):
        return todo("Brancher les logs du Gardien TailBlue.")

    @router.get("/errors")
    async def errors(_session=Depends(require_hime_session)):
        return todo("Brancher le registre d'erreurs du Gardien.")

    @router.patch("/errors/{error_id}")
    async def patch_error(error_id: str, payload: dict[str, Any], _session=Depends(require_hime_session)):
        return todo("Brancher l'état open/resolved/ignored du Gardien.")

    @router.get("/security")
    async def security(_session=Depends(require_hime_session)):
        return todo("Brancher la session Discord et bot.guilds.")

    @router.post("/security/guilds/{guild_id}/leave")
    async def leave_guild(guild_id: str, _session=Depends(require_hime_session)):
        return todo("Réutiliser la protection de !quitterserveur; serveur officiel interdit.")

    @router.get("/players")
    async def players(_session=Depends(require_hime_session)):
        return todo("Brancher l'index de stats_tailblue.json.")

    @router.get("/players/{player_id}")
    async def player(player_id: str, _session=Depends(require_hime_session)):
        return todo("Brancher le dossier admin du joueur.")

    @router.post("/players/{player_id}/action")
    async def player_action(player_id: str, payload: dict[str, Any], _session=Depends(require_hime_session)):
        return todo("Réutiliser givecookies/givexp/giverep/royalgift/reset* sans dupliquer la logique.")

    @router.get("/economy")
    async def economy(_session=Depends(require_hime_session)):
        return todo("Calculer un snapshot réel des profils/guildes/marché.")

    @router.get("/system")
    async def system(_session=Depends(require_hime_session)):
        return todo("Réutiliser BotCheck du Gardien TailBlue.")

    @router.post("/system/backup")
    async def backup(_session=Depends(require_hime_session)):
        return todo("Réutiliser la sauvegarde manuelle du Gardien.")

    return router
