"""Petit registre public des mises à jour TailBlue.

Le bot écrit ici lorsqu'une annonce !update est réellement publiée.
Le serveur tailblue_updates_api.py expose ensuite le JSON et les images à
l'application Desktop. Aucun module externe n'est requis.
"""

from __future__ import annotations

import json
import re
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

BASE_DIR = Path(__file__).resolve().parent
UPDATES_FILE = BASE_DIR / "tailblue_updates.json"
ASSETS_DIR = BASE_DIR / "tailblue_updates_assets"
_MAX_UPDATES = 250
_LOCK = threading.RLock()


def _empty_store() -> dict[str, Any]:
    return {"version": 1, "updates": []}


def _atomic_write(data: dict[str, Any]) -> None:
    UPDATES_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = UPDATES_FILE.with_suffix(UPDATES_FILE.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    tmp.replace(UPDATES_FILE)


def load_update_store() -> dict[str, Any]:
    with _LOCK:
        if not UPDATES_FILE.exists():
            return _empty_store()
        try:
            with UPDATES_FILE.open("r", encoding="utf-8") as handle:
                raw = json.load(handle)
        except Exception:
            return _empty_store()

        if isinstance(raw, list):
            return {"version": 1, "updates": raw}
        if not isinstance(raw, dict):
            return _empty_store()

        updates = raw.get("updates")
        if not isinstance(updates, list):
            updates = []
        return {"version": int(raw.get("version", 1) or 1), "updates": updates}


def load_public_updates() -> list[dict[str, Any]]:
    return list(load_update_store().get("updates", []))


def _excerpt(text: str, limit: int = 220) -> str:
    clean = re.sub(r"\s+", " ", str(text or "")).strip()
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "…"


def _safe_name(filename: str) -> tuple[str, str]:
    original = Path(str(filename or "image.png")).name
    suffix = Path(original).suffix.casefold()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        suffix = ".png"

    stem = Path(original).stem
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", stem).strip("-_") or "image"
    token = uuid.uuid4().hex[:10]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return original, f"{stamp}-{token}-{stem[:48]}{suffix}"


def store_update_image_bytes(data: bytes, original_filename: str) -> dict[str, str]:
    """Sauvegarde durable d'une image jointe à !update.

    Retourne à la fois le chemin local (pour la republier sur Discord) et
    l'URL relative que l'API Desktop exposera.
    """
    if not isinstance(data, (bytes, bytearray)) or not data:
        raise ValueError("Image vide.")

    original, stored = _safe_name(original_filename)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    target = ASSETS_DIR / stored
    target.write_bytes(bytes(data))
    return {
        "original": original,
        "filename": stored,
        "path": str(target),
        "url": f"/update-assets/{stored}",
    }


def record_update_article(
    *,
    title: str,
    body: str,
    image_urls: Iterable[str] | None = None,
    author_id: int | str | None = None,
    discord_channel_id: int | str | None = None,
    tag: str = "Mise à jour",
) -> dict[str, Any]:
    """Ajoute une annonce publiée au flux lu par l'application Desktop."""
    body = str(body or "").strip()
    if not body:
        raise ValueError("Le texte de la mise à jour est vide.")

    title = str(title or "").strip() or "Mise à jour de TailBlue"
    tag = str(tag or "").strip() or "Mise à jour"
    urls = [str(url).strip() for url in (image_urls or []) if str(url).strip()]

    now = datetime.now(timezone.utc)
    article = {
        "id": f"update-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}",
        "title": title,
        "body": body,
        "excerpt": _excerpt(body),
        "published_at": now.isoformat(),
        "image_urls": urls[:10],
        "tag": tag,
        "author": "Hime-sama",
        "author_id": str(author_id) if author_id is not None else None,
        "discord_channel_id": str(discord_channel_id) if discord_channel_id is not None else None,
        "source": "discord_update",
    }

    with _LOCK:
        store = load_update_store()
        updates = [entry for entry in store.get("updates", []) if isinstance(entry, dict)]
        updates.insert(0, article)
        store["updates"] = updates[:_MAX_UPDATES]
        _atomic_write(store)

    return article


__all__ = [
    "ASSETS_DIR",
    "UPDATES_FILE",
    "load_public_updates",
    "load_update_store",
    "record_update_article",
    "store_update_image_bytes",
]
