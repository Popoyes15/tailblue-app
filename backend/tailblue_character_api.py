"""
TailBlue — adaptateurs pour la future API Personnage.

Ce fichier est volontairement indépendant de main.py pour éviter les imports
circulaires. Pendant la phase hébergement, les routes FastAPI appelleront les
fonctions existantes du bot et fourniront leurs résultats à ces sérialiseurs.

Règle fondamentale :
le client React ne décide jamais de l'identité, du rang, de la race, du métier,
de la guilde, de l'équipement ou des statistiques.
"""

from __future__ import annotations

from typing import Any, Iterable, Mapping


def public_asset(path: str | None) -> str | None:
    if not path:
        return None
    value = str(path).replace("\\", "/").lstrip("/")
    return f"/{value}"


def serialize_race(
    *,
    race: Any,
    player: Mapping[str, Any],
    unlocked_skills: Iterable[Any],
    pending_levels: Iterable[int],
    image_path: str | None,
) -> dict | None:
    if race is None:
        return None

    skills = []
    for skill in unlocked_skills:
        summary = None
        try:
            summary = skill.summary()
        except Exception:
            pass

        skills.append(
            {
                "id": str(skill.id),
                "name": str(skill.name),
                "description": str(skill.description),
                "unlockLevel": int(skill.unlock_level),
                "summary": summary,
                "element": getattr(skill, "element", None),
                "learned": True,
            }
        )

    pending = list(pending_levels)

    return {
        "kind": "race",
        "id": str(race.id),
        "name": str(race.name),
        "emoji": str(race.emoji),
        "imageUrl": public_asset(image_path),
        "description": str(race.description),
        "archetype": str(race.archetype),
        "elements": list(race.elements),
        "preferredWeapons": list(race.preferred_weapons),
        "statBonuses": dict(race.stat_bonuses),
        "combatLevel": int(player.get("combat_level", 1) or 1),
        "unlockedSkills": skills,
        "nextSkillLevel": int(pending[0]) if pending else None,

        # Ne PAS inventer de lore si equipment.py ne le possède pas encore.
        "origin": getattr(race, "origin", None),
        "kingdom": getattr(race, "kingdom", None),
        "history": getattr(race, "history", None),

        "exclusive": bool(getattr(race, "exclusive", False)),
        "previewOnly": False,
    }


def serialize_job(
    *,
    job_id: str | None,
    jobs: Mapping[str, Mapping[str, Any]],
    codex: Mapping[str, Mapping[str, Any]],
) -> dict | None:
    if not job_id or job_id not in jobs:
        return None

    definition = jobs[job_id]
    lore = codex.get(job_id, {})

    raw_name = str(definition.get("nom", job_id))
    salary = lore.get("salaire")

    salary_min = None
    salary_max = None
    if isinstance(salary, (list, tuple)) and len(salary) >= 2:
        salary_min = int(salary[0])
        salary_max = int(salary[1])

    return {
        "kind": "job",
        "id": str(job_id),
        "name": raw_name,
        "emoji": raw_name.split(" ", 1)[0] if raw_name else "💼",
        "imageUrl": public_asset(lore.get("image")),
        "requiredLevel": int(definition.get("niveau", 1) or 1),
        "description": lore.get("description"),
        "specialty": lore.get("specialite"),
        "quote": lore.get("citation"),
        "salaryMin": salary_min,
        "salaryMax": salary_max,
        "previewOnly": False,
    }


def serialize_guild(
    *,
    guild_name: str | None,
    guild: Mapping[str, Any] | None,
    image_path: str | None,
    hall_info: Mapping[str, Any] | None,
    members: list[dict],
    founder_name: str | None,
) -> dict | None:
    if not guild_name or not isinstance(guild, Mapping):
        return None

    level = int(guild.get("niveau", 1) or 1)

    hall = None
    if isinstance(hall_info, Mapping):
        hall = {
            "name": str(
                hall_info.get("nom", "🏛️ Hall des Reliques")
            ),
            "description": hall_info.get("description"),
            "imageUrl": public_asset(hall_info.get("image")),
            "level": int(guild.get("hall_level", 1) or 1),
            "xp": int(guild.get("hall_xp", 0) or 0),
        }

    return {
        "kind": "guild",
        "id": str(guild_name),
        "name": str(guild_name),
        "imageUrl": public_asset(image_path),
        "founderId": (
            str(guild.get("fondateur"))
            if guild.get("fondateur") is not None
            else None
        ),
        "founderName": founder_name,
        "level": level,
        "xp": int(guild.get("xp", 0) or 0),
        "xpNeeded": level * 100,
        "treasure": int(guild.get("tresor", 0) or 0),
        "maxMembers": int(guild.get("max_membres", 5) or 5),
        "members": members,
        "hall": hall,
        "activities": [
            "Missions de guilde",
            "Chasses de guilde",
            "Expéditions",
            "Hall des Reliques",
            "Chroniques",
        ],
        "previewOnly": False,
    }


def serialize_residence(
    *,
    residence_id: str,
    house: Mapping[str, Any],
    description: str | None,
    effects: Mapping[str, Any] | None,
) -> dict:
    effect_rows = []

    if isinstance(effects, Mapping):
        if "cookies_pct" in effects:
            value = int(effects["cookies_pct"])
            effect_rows.append(
                {
                    "label": "Cookies",
                    "value": f"{value:+d} %",
                }
            )

        if "xp_pct" in effects:
            value = int(effects["xp_pct"])
            effect_rows.append(
                {
                    "label": "XP",
                    "value": f"{value:+d} %",
                }
            )

        if "cooldown_minutes" in effects:
            value = int(effects["cooldown_minutes"])
            effect_rows.append(
                {
                    "label": "Temps de repos",
                    "value": f"{value:+d} min",
                }
            )

    return {
        "kind": "residence",
        "id": str(residence_id),
        "name": str(house.get("nom", residence_id)),
        "imageUrl": public_asset(
            house.get("exterieur", house.get("image"))
        ),
        "description": description,
        "price": house.get("prix"),
        "effects": effect_rows,
        "previewOnly": False,
    }


def serialize_companion(
    *,
    pet_id: str | None,
    definition: Mapping[str, Any] | None,
    pet_data: Mapping[str, Any] | None,
    display_name: str | None,
    relation_name: str | None,
    image_path: str | None,
    stats: Mapping[str, Any] | None,
    abilities: Iterable[str] | None,
) -> dict | None:
    if not pet_id or not isinstance(definition, Mapping):
        return None

    data = pet_data if isinstance(pet_data, Mapping) else {}

    return {
        "kind": "companion",
        "id": str(pet_id),
        "displayName": str(
            display_name or definition.get("nom", pet_id)
        ),
        "speciesName": definition.get("nom"),
        "imageUrl": public_asset(image_path),
        "emoji": definition.get("emoji"),
        "level": int(data.get("niveau", 1) or 1),
        "affection": int(data.get("affection", 0) or 0),
        "relation": relation_name,
        "story": (
            definition.get("histoire_complete")
            or definition.get("histoire")
        ),
        "stats": dict(stats or {}),
        "abilities": list(abilities or []),
        "previewOnly": False,
    }


def serialize_rank(
    *,
    rank: str | None,
    score: float | None,
    factors: list[dict] | None = None,
) -> dict:
    return {
        "kind": "rank",
        "rank": rank,
        "score": score,
        "ladder": ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"],
        "explanation": (
            "Le Rang d'Aventurier mesure la puissance réelle du personnage. "
            "Il prend notamment en compte les statistiques, l'équipement, "
            "les compétences, la race et l'expérience."
        ),
        "factors": factors or [],
        "previewOnly": False,
    }
