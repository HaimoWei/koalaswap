from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

from .config import Config
from .utils import write_json


@dataclass
class PlaceholderSeller:
    seller_id: str
    email: str
    display_name: str
    password: str


class MetadataStore:
    def __init__(self, config: Config) -> None:
        self.config = config
        self._category_file = self.config.output_file("category_mapping.json")
        self._seller_file = self.config.output_file("seed_seller_mapping.json")
        self._user_metadata_file = self.config.output_file("seed_user_metadata.json")

    def load_placeholder_sellers(self) -> Dict[str, PlaceholderSeller]:
        if not self._seller_file.exists():
            return {}
        raw = json.loads(self._seller_file.read_text(encoding="utf-8"))
        return {
            entry["seller_id"]: PlaceholderSeller(
                seller_id=entry["seller_id"],
                email=entry["email"],
                display_name=entry["display_name"],
                password=entry.get("password", self.config.default_password),
            )
            for entry in raw
        }

    def save_placeholder_sellers(self, sellers: List[PlaceholderSeller]) -> None:
        write_json(
            self._seller_file,
            [
                {
                    "seller_id": s.seller_id,
                    "email": s.email,
                    "display_name": s.display_name,
                    "password": s.password,
                }
                for s in sellers
            ],
        )

    def save_user_metadata(self, metadata: Dict[str, Dict[str, str | None]]) -> None:
        write_json(self._user_metadata_file, metadata)

    def save_category_mapping(self, mapping: Dict[str, int]) -> None:
        write_json(self._category_file, mapping)
