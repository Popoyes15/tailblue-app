"""
Squelette d'adaptateur pour l'Accueil TailBlue Desktop.

À intégrer pendant la phase backend, pas maintenant.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any


def build_home_snapshot(
    *,
    member: Any,
    stats: dict,
    profile: dict,
    infos_niveau,
    sync_adventurer_rank,
    save_stats,
    init_quest_user,
    refresh_quest_state,
    get_active_pet_ids,
    get_pet_definition,
    get_pet_display_name,
    get_pet_combat_profile,
    mine_engine,
    notifications: list[dict] | None = None,
    recent_activity: list[dict] | None = None,
    hime_summary: dict | None = None,
) -> dict:
    xp_total = int(profile.get("xp", 0) or 0)
    level, xp_current, xp_needed = infos_niveau(xp_total)

    _rank_result, changed = sync_adventurer_rank(
        member,
        profile,
    )
    if changed:
        save_stats(stats)

    init_quest_user(stats, member.id)
    refresh_quest_state(profile)

    active_quest_id = (
        profile.get("quest_active_id")
        or profile.get("quest_type")
        or None
    )

    offers = list(profile.get("quest_offers", []) or [])
    available_quests = (
        0 if active_quest_id else len(offers)
    )

    pet_ids = get_active_pet_ids(stats, member.id)
    companion = None

    if pet_ids:
        pet_id = pet_ids[0]
        definition = get_pet_definition(pet_id) or {}
        pet_data = (
            profile.get("pet_data", {})
            .get(pet_id, {})
        )
        combat = get_pet_combat_profile(pet_id) or {}

        image = definition.get("image")

        companion = {
            "id": pet_id,
            "displayName": get_pet_display_name(
                stats,
                member.id,
                pet_id,
            ),
            "speciesName": definition.get("nom"),
            "imageUrl": (
                f"/{str(image).lstrip('/')}"
                if image
                else None
            ),
            "emoji": definition.get("emoji"),
            "level": int(pet_data.get("niveau", 1) or 1),
            "affection": int(
                pet_data.get("affection", 0) or 0
            ),
            "damage": combat.get(
                "attaque",
                definition.get("stats", {}).get("attaque"),
            ),
        }

    state = mine_engine.economy.get_state(member.id)

    hp = int(getattr(state, "hp", 0) or 0)
    max_hp = int(
        getattr(state, "max_hp", hp) or hp
    )
    energy = int(
        getattr(state, "energy", 0) or 0
    )
    max_energy = int(
        getattr(state, "max_energy", energy) or energy
    )

    avatar = getattr(
        getattr(member, "display_avatar", None),
        "url",
        None,
    )

    return {
        "generatedAt": datetime.now().isoformat(),
        "mode": "api",
        "profile": {
            "id": str(member.id),
            "displayName": str(member.display_name),
            "avatarUrl": str(avatar) if avatar else None,
            "isHime": bool(hime_summary is not None),
            "xpTotal": xp_total,
            "level": int(level),
            "xpCurrent": int(xp_current),
            "xpNeeded": int(xp_needed),
            "cookies": int(
                profile.get("cookies", 0) or 0
            ),
            "adventurerRank": profile.get(
                "rang_aventurier"
            ),
            "adventurerScore": float(
                profile.get(
                    "rang_aventurier_score",
                    0,
                )
                or 0
            ),
        },
        "hp": hp,
        "maxHp": max_hp,
        "energy": energy,
        "maxEnergy": max_energy,
        "quests": {
            "available": available_quests,
            "activeId": active_quest_id,
            "activeName": None,
            "completed": bool(
                profile.get("quest_completed_at")
            ),
        },
        "companion": companion,
        "recentActivity": recent_activity or [],
        "notifications": notifications or [],
        "hime": hime_summary,
    }
