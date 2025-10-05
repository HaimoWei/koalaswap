from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List

from .config import Config


@dataclass
class UserRecord:
    id: str
    email: str
    display_name: str
    username: str | None
    first_name: str | None
    last_name: str | None
    data: Dict[str, Any]


@dataclass
class ProductRecord:
    id: str
    seller_id: str
    title: str
    description: str
    price: int
    original_text: str
    category: str
    condition: str
    images: List[Dict[str, Any]]
    data: Dict[str, Any]


class DatasetLoader:
    def __init__(self, config: Config) -> None:
        self.config = config

    def load_users(self, include_supplement: bool = False) -> Dict[str, UserRecord]:
        users = self._load_user_file("users_complete.json")
        # Supplement overwrites or appends additional profiles (missing first/last name)
        if include_supplement:
            supplement = self._load_user_file("users_supplement.json")
            users.update(supplement)
        return users

    def _load_user_file(self, filename: str) -> Dict[str, UserRecord]:
        path = self.config.dataset_file(filename)
        raw = json.loads(path.read_text(encoding="utf-8"))
        records: Dict[str, UserRecord] = {}
        for entry in raw:
            records[entry["id"]] = UserRecord(
                id=entry["id"],
                email=entry["email"],
                display_name=entry.get("display_name") or entry.get("displayName", ""),
                username=entry.get("username"),
                first_name=entry.get("first_name"),
                last_name=entry.get("last_name"),
                data=entry,
            )
        return records

    def load_products(self, part: str = "complete") -> List[ProductRecord]:
        filename = "products_complete.json" if part == "complete" else "products_supplement.json"
        path = self.config.dataset_file(filename)
        raw = json.loads(path.read_text(encoding="utf-8"))
        products: List[ProductRecord] = []
        for entry in raw:
            products.append(
                ProductRecord(
                    id=entry["id"],
                    seller_id=entry["seller_id"],
                    title=entry["title"],
                    description=entry.get("description", ""),
                    price=int(entry.get("price", 0)),
                    original_text=entry.get("original_text", ""),
                    category=entry.get("category", ""),
                    condition=entry.get("condition", "GOOD"),
                    images=entry.get("images", []),
                    data=entry,
                )
            )
        return products

    def load_progress_snapshot(self, part: str) -> Dict[str, Any] | None:
        candidates = list(self.config.dataset_dir.glob(f"progress_{part}_*.json"))
        if not candidates:
            return None
        latest = max(candidates)
        return json.loads(latest.read_text(encoding="utf-8"))
