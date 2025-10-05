from __future__ import annotations

import random
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, List, Sequence

from .config import Config
from .dataset_loader import DatasetLoader, ProductRecord, UserRecord
from .metadata_store import MetadataStore, PlaceholderSeller
from .normalizers import normalize_condition, normalize_price
from .utils import write_json


@dataclass
class Summary:
    users_total: int
    products_total: int
    placeholder_sellers: int
    categories: Dict[str, int]

    def to_dict(self) -> Dict[str, int | Dict[str, int]]:
        return {
            "users_total": self.users_total,
            "products_total": self.products_total,
            "placeholder_sellers": self.placeholder_sellers,
            "categories": self.categories,
        }


class SeedPreparer:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.loader = DatasetLoader(config)
        self.metadata_store = MetadataStore(config)
        self.random = random.Random(config.random_seed)

    def run(self) -> Summary:
        users = self.loader.load_users(include_supplement=self.config.include_supplement)
        products = self.loader.load_products(part=self.config.dataset_part)

        self._persist_user_metadata(users)

        placeholder_sellers = self._collect_placeholder_sellers(users, products)
        self.metadata_store.save_placeholder_sellers(placeholder_sellers)

        category_mapping = self._build_category_mapping(products)
        self.metadata_store.save_category_mapping(category_mapping)

        self._persist_user_seed_snapshot(users, placeholder_sellers)
        self._persist_product_snapshot(products, users, placeholder_sellers, category_mapping)

        summary = Summary(
            users_total=len(users),
            products_total=len(products),
            placeholder_sellers=len(placeholder_sellers),
            categories=Counter(p.category for p in products),
        )
        write_json(self.config.output_file("summary.json"), summary.to_dict())
        return summary

    def _persist_user_metadata(self, users: Dict[str, UserRecord]) -> None:
        metadata = {
            user.id: {
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
            for user in users.values()
        }
        self.metadata_store.save_user_metadata(metadata)

    def _collect_placeholder_sellers(
        self, users: Dict[str, UserRecord], products: Sequence[ProductRecord]
    ) -> List[PlaceholderSeller]:
        known_ids = set(users.keys())
        placeholder_records = self.metadata_store.load_placeholder_sellers()
        placeholders: List[PlaceholderSeller] = []

        for seller_id in sorted({p.seller_id for p in products}):
            if seller_id in known_ids:
                continue
            if seller_id in placeholder_records:
                placeholders.append(placeholder_records[seller_id])
                continue
            email = f"seed-seller+{seller_id[:8]}@koalaswap.local"
            display_name = f"Seed Seller {seller_id[:8].upper()}"
            placeholders.append(
                PlaceholderSeller(
                    seller_id=seller_id,
                    email=email,
                    display_name=display_name,
                    password=self.config.default_password,
                )
            )
        return placeholders

    def _build_category_mapping(self, products: Sequence[ProductRecord]) -> Dict[str, int]:
        # Current dataset only contains Smart Phones, but keep structure extendable.
        mapping: Dict[str, int] = {"Smart Phones": 1011}
        categories = sorted({p.category for p in products if p.category})
        for cat in categories:
            mapping.setdefault(cat, 1011 if cat == "Smart Phones" else 0)
        return mapping

    def _persist_user_seed_snapshot(
        self, users: Dict[str, UserRecord], placeholders: Sequence[PlaceholderSeller]
    ) -> None:
        entries = []
        for user in sorted(users.values(), key=lambda u: u.email):
            entries.append(
                {
                    "user_id": user.id,
                    "email": user.email,
                    "display_name": user.display_name,
                    "password": self.config.default_password,
                    "phone_verified": user.data.get("phone_verified", False),
                    "email_verified": user.data.get("email_verified", True),
                    "rating_avg": user.data.get("rating_avg", 0),
                    "rating_count": user.data.get("rating_count", 0),
                    "member_since": user.data.get("member_since"),
                    "source": user.data.get("source"),
                }
            )
        for placeholder in placeholders:
            entries.append(
                {
                    "user_id": placeholder.seller_id,
                    "email": placeholder.email,
                    "display_name": placeholder.display_name,
                    "password": placeholder.password,
                    "phone_verified": False,
                    "email_verified": True,
                    "rating_avg": 0,
                    "rating_count": 0,
                    "member_since": None,
                    "source": "placeholder",
                }
            )
        write_json(self.config.output_file("user_seed_snapshot.json"), entries)

    def _persist_product_snapshot(
        self,
        products: Sequence[ProductRecord],
        users: Dict[str, UserRecord],
        placeholders: Sequence[PlaceholderSeller],
        category_mapping: Dict[str, int],
    ) -> None:
        seller_lookup = {user.id: user.email for user in users.values()}
        seller_lookup.update({p.seller_id: p.email for p in placeholders})

        entries = []
        for product in products:
            try:
                normalized_condition = normalize_condition(product.condition)
                normalized_price = normalize_price(
                    product.price, product.original_text, self.config.price_exchange_rate
                )
            except ValueError as exc:
                raise ValueError(f"Product {product.id} failed validation: {exc}") from exc

            free_shipping = self.random.random() < self.config.free_shipping_probability
            category_id = category_mapping.get(product.category, 0)

            entries.append(
                {
                    "product_id": product.id,
                    "seller_id": product.seller_id,
                    "seller_email": seller_lookup.get(product.seller_id),
                    "title": product.title,
                    "description": product.description,
                    "price_aud": float(normalized_price),
                    "condition": normalized_condition,
                    "category_id": category_id,
                    "free_shipping": free_shipping,
                    "images": product.images,
                    "image_count": len(product.images),
                    "dataset_part": self.config.dataset_part,
                }
            )
        write_json(self.config.output_file("product_seed_snapshot.json"), entries)
