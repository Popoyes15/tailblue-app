"""
TailBlue Desktop — adaptateurs Inventaire / Equipment / Craft.

Ce fichier prépare la phase hébergement. Il ne remplace pas equipment.py,
craft.py ni items.py : il doit APPELER ces moteurs.

Source de vérité :
    stats[user_id]["inventaire_equipement"]
"""

from __future__ import annotations

from typing import Any, Mapping, MutableMapping


SLOT_META = {
    "weapon": ("⚔️", "Arme"),
    "helmet": ("🪖", "Casque"),
    "chest": ("🥋", "Plastron"),
    "gloves": ("🧤", "Gants"),
    "leggings": ("👖", "Jambières"),
    "boots": ("🥾", "Bottes"),
    "ring": ("💍", "Anneau"),
    "amulet": ("📿", "Amulette"),
}


def serialize_stats(stats: Any) -> dict:
    return {
        "hp": float(getattr(stats, "hp", 0) or 0),
        "attack": float(getattr(stats, "attack", 0) or 0),
        "defense": float(getattr(stats, "defense", 0) or 0),
        "crit": float(getattr(stats, "crit", 0) or 0),
        "dodge": float(getattr(stats, "dodge", 0) or 0),
        "luck": float(getattr(stats, "luck", 0) or 0),
    }


def serialize_item(item: Any, quantity: int) -> dict:
    rarity = getattr(item, "rarity", None)
    rarity_value = getattr(rarity, "value", str(rarity or "common"))

    item_type = getattr(item, "item_type", None)
    item_type_value = getattr(
        item_type,
        "value",
        str(item_type or "material"),
    )

    slot = getattr(item, "slot", None)
    slot_value = getattr(slot, "value", None)

    stats = getattr(item, "stats", None)
    if stats is None:
        stats = getattr(item, "passive_stats", None)

    effects = []
    for effect in getattr(item, "effects", []) or []:
        description = getattr(effect, "description", None)
        if description:
            effects.append(str(description))

    rarity_label = None
    try:
        rarity_label = item.rarity_label()
    except Exception:
        rarity_label = rarity_value

    return {
        "id": str(item.id),
        "name": str(item.name),
        "emoji": str(getattr(item, "emoji", "📦")),
        "type": item_type_value,
        "rarity": rarity_value,
        "rarityLabel": str(rarity_label),
        "quantity": max(0, int(quantity)),
        "description": str(
            getattr(item, "description", "") or ""
        ),
        "lore": getattr(item, "lore", None),
        "imageUrl": getattr(item, "image_url", None),
        "element": (
            getattr(getattr(item, "element", None), "value", None)
        ),
        "slot": slot_value,
        "slotLabel": (
            f"{SLOT_META[slot_value][0]} {SLOT_META[slot_value][1]}"
            if slot_value in SLOT_META
            else None
        ),
        "levelRequired": int(
            getattr(item, "level_required", 1) or 1
        ),
        "stats": serialize_stats(stats) if stats else None,
        "effects": effects,
        "family": getattr(item, "family", None),
        "tags": sorted(
            str(tag)
            for tag in (getattr(item, "tags", set()) or set())
        ),
        "stackable": bool(
            getattr(item, "stackable", True)
        ),
    }


def build_equipment_snapshot(
    *,
    player: MutableMapping[str, Any],
    items: Mapping[str, Any],
    normalize_equipment,
    get_player_rpg_inventory,
    calculate_equipment_stats,
    base_player_stats,
    player_level: int,
    preferred_weapon_families=(),
    weapon_masteries=None,
) -> dict:
    inventory = get_player_rpg_inventory(
        player,
        create=True,
        fallback_to_legacy=True,
    )

    equipment = normalize_equipment(
        player.get(
            "equipement",
            player.get("equipment", {}),
        )
    )

    active_stats = calculate_equipment_stats(
        equipment,
        base_stats=base_player_stats,
        weapon_masteries=weapon_masteries,
        favorite_weapon_families=preferred_weapon_families,
    )

    slots = []

    for slot_id, (emoji, label) in SLOT_META.items():
        equipped_id = equipment.get(slot_id)
        equipped_item = (
            items.get(equipped_id)
            if equipped_id
            else None
        )

        owned_choices = []

        for item_id, quantity in inventory.items():
            item = items.get(item_id)
            slot = getattr(
                getattr(item, "slot", None),
                "value",
                None,
            )

            if (
                item is not None
                and slot == slot_id
                and int(quantity) > 0
            ):
                owned_choices.append(
                    serialize_item(item, int(quantity))
                )

        slots.append(
            {
                "slot": slot_id,
                "label": label,
                "emoji": emoji,
                "equippedItemId": equipped_id,
                "equippedItem": (
                    serialize_item(
                        equipped_item,
                        int(inventory.get(equipped_id, 1)),
                    )
                    if equipped_item is not None
                    else None
                ),
                "ownedChoices": owned_choices,
            }
        )

    return {
        "slots": slots,
        "activeStats": serialize_stats(active_stats),
        "baseStats": serialize_stats(base_player_stats),
        "affinityText": None,
        "playerLevel": int(player_level),
    }


async def equip_from_api(
    *,
    player: MutableMapping[str, Any],
    item_id: str,
    items: Mapping[str, Any],
    normalize_equipment,
    get_player_rpg_inventory,
    equip_item,
    player_level: int,
) -> str:
    """
    IMPORTANT :
    l'API appelle la MÊME fonction equip_item que !equipement.
    """
    item = items.get(item_id)
    if item is None:
        raise ValueError("Objet introuvable.")

    inventory = get_player_rpg_inventory(
        player,
        create=True,
        fallback_to_legacy=True,
    )

    equipment = normalize_equipment(
        player.get(
            "equipement",
            player.get("equipment", {}),
        )
    )

    equip_item(
        equipment,
        item_id,
        player_level=player_level,
        inventory=inventory,
    )

    player["equipement"] = equipment

    return f"✅ {item.name} est maintenant équipé."


async def unequip_from_api(
    *,
    player: MutableMapping[str, Any],
    slot: str,
    normalize_equipment,
    unequip_slot,
    equipment_slot_enum,
) -> str:
    """
    IMPORTANT :
    l'API appelle la MÊME fonction unequip_slot que !equipement.
    """
    equipment = normalize_equipment(
        player.get(
            "equipement",
            player.get("equipment", {}),
        )
    )

    try:
        enum_slot = equipment_slot_enum(slot)
    except ValueError as exc:
        raise ValueError("Emplacement invalide.") from exc

    previous = unequip_slot(equipment, enum_slot)

    if previous is None:
        raise ValueError("Rien à déséquiper.")

    player["equipement"] = equipment

    return "🟥 Objet déséquipé."


async def craft_from_api(
    *,
    repository: Any,
    user_id: int,
    item_id: str,
    quantity: int,
) -> tuple[Any, int, set[str]]:
    """
    IMPORTANT :
    ne jamais reproduire craft.py dans FastAPI.

    On réutilise directement :
        await CraftRepository.craft(...)
    """
    return await repository.craft(
        user_id,
        item_id,
        quantity,
    )
