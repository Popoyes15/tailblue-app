"""
TailBlue API — contrat Mine / Combat pour l'application Desktop.

Cette version prépare le transfert des données de monsters.py vers React.

PRINCIPE FINAL :
- monsters.py reste la source de vérité pour identité/famille/stats des monstres ;
- combat.py reste la source de vérité pour l'état du combat ;
- React reçoit seulement un snapshot ;
- React choisit le PNG via `family + boss` avec la même convention que bestiaire.py.

Exemple de sérialisation d'un Monster de monsters.py :

    def monster_to_combatant(monster, current_hp):
        return {
            "id": monster.id,
            "monsterId": monster.id,
            "name": monster.name,
            "emoji": monster.emoji,
            "family": monster.family,
            "boss": bool(monster.boss),
            "level": monster.level,
            "hp": current_hp,
            "maxHp": monster.hp,
        }

Aucun nom de monstre ne doit être inventé dans l'application finale.
"""

from __future__ import annotations

from typing import Any, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="TailBlue API", version="0.2.0")

# DEV uniquement.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MineAction(BaseModel):
    action: Literal[
        "move",
        "mine",
        "search",
        "rest",
        "descend",
        "use_potion",
        "combat_attack",
        "combat_skill",
        "combat_defend",
        "combat_flee",
        "pet_feed",
        "pet_cuddle",
    ]
    roomId: str | None = None
    potionId: str | None = None
    skillId: str | None = None
    foodId: str | None = None


def monster_to_combatant(monster: Any, current_hp: int | None = None) -> dict[str, Any]:
    """
    Adaptateur officiel monsters.py -> frontend.

    Il n'impose PAS de chemin PNG :
    l'application utilise la même convention famille/boss que bestiaire.py.
    """
    max_hp = int(getattr(monster, "hp", 1))
    return {
        "id": str(getattr(monster, "id", "unknown")),
        "monsterId": str(getattr(monster, "id", "unknown")),
        "name": str(getattr(monster, "name", "Créature inconnue")),
        "emoji": str(getattr(monster, "emoji", "❓")),
        "family": str(getattr(monster, "family", "unknown")),
        "boss": bool(getattr(monster, "boss", False)),
        "level": int(getattr(monster, "level", 1)),
        "hp": max_hp if current_hp is None else int(current_hp),
        "maxHp": max_hp,
    }


@app.get("/api/status")
async def status() -> dict[str, Any]:
    return {"connected": True, "version": "0.2.0"}


@app.get("/api/mine")
async def mine_snapshot() -> dict[str, Any]:
    raise HTTPException(
        status_code=501,
        detail="À brancher sur l'état réel de mine.py/combat.py.",
    )


@app.post("/api/mine/action")
async def mine_action(payload: MineAction) -> dict[str, Any]:
    """
    Sécurité finale attendue côté serveur :
    - si combat actif : REFUSER toute action move ;
    - seule combat_flee peut tenter une fuite ;
    - si fuite échoue : combat reste actif ;
    - si fuite réussit : combat devient inactif ;
    - les PV, dégâts, compétences, potions et loot sont calculés côté Python.
    """
    raise HTTPException(
        status_code=501,
        detail=f"Action '{payload.action}' à brancher sur le moteur TailBlue.",
    )
