"""Routes READ-ONLY pour les pages Informations de l'application TailBlue.

À monter dans le FastAPI principal hébergé :
    from tailblue_information_api import router as information_router
    app.include_router(information_router)

Variables facultatives :
    TAILBLUE_UPDATES_FILE=/chemin/tailblue_updates.json
    TAILBLUE_UPDATE_ASSETS_DIR=/chemin/tailblue_updates_assets
    TAILBLUE_ROADMAP_FILE=/chemin/tailblue_roadmap.json

Le frontend attend :
    GET /api/updates
    GET /api/roadmap
    GET /api/update-assets/{filename}
    GET /api/information/stream   (optionnel, SSE)
"""

from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

BASE_DIR = Path(__file__).resolve().parent
UPDATES_FILE = Path(os.getenv("TAILBLUE_UPDATES_FILE", BASE_DIR / "tailblue_updates.json"))
ASSETS_DIR = Path(os.getenv("TAILBLUE_UPDATE_ASSETS_DIR", BASE_DIR / "tailblue_updates_assets"))
ROADMAP_FILE = Path(os.getenv("TAILBLUE_ROADMAP_FILE", BASE_DIR / "tailblue_roadmap.json"))

router = APIRouter(prefix="/api", tags=["informations"])


def _read_json(path: Path, fallback):
    if not path.exists():
        return fallback
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return fallback


def _mtime(path: Path) -> float:
    try:
        return path.stat().st_mtime
    except OSError:
        return 0.0


@router.get("/updates")
def updates():
    raw = _read_json(UPDATES_FILE, {"updates": []})
    rows = raw if isinstance(raw, list) else raw.get("updates", []) if isinstance(raw, dict) else []
    rows = [row for row in rows if isinstance(row, dict)]
    return {"updates": rows, "count": len(rows)}


@router.get("/roadmap")
def roadmap():
    raw = _read_json(ROADMAP_FILE, {"items": []})
    rows = raw if isinstance(raw, list) else raw.get("items", []) if isinstance(raw, dict) else []
    updated_at = raw.get("updated_at") if isinstance(raw, dict) else None
    return {"items": [row for row in rows if isinstance(row, dict)], "updated_at": updated_at}


@router.get("/update-assets/{filename}")
def update_asset(filename: str):
    safe_name = Path(filename).name
    target = (ASSETS_DIR / safe_name).resolve()
    root = ASSETS_DIR.resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc
    if not target.is_file():
        raise HTTPException(status_code=404, detail="not_found")
    return FileResponse(target)


@router.get("/information/stream")
async def information_stream():
    """SSE optionnel : avertit l'application dès qu'un JSON change sur disque."""
    async def events():
        last_updates = _mtime(UPDATES_FILE)
        last_roadmap = _mtime(ROADMAP_FILE)
        yield 'data: {"type":"all"}\n\n'
        while True:
            await asyncio.sleep(2)
            current_updates = _mtime(UPDATES_FILE)
            current_roadmap = _mtime(ROADMAP_FILE)
            if current_updates != last_updates:
                last_updates = current_updates
                yield 'data: {"type":"updates"}\n\n'
            if current_roadmap != last_roadmap:
                last_roadmap = current_roadmap
                yield 'data: {"type":"roadmap"}\n\n'
            yield ': keepalive\n\n'

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
