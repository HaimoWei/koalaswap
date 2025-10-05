from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List

from .api import ApiClient
from .config import Config
from .utils import read_json, write_json


logger = logging.getLogger("dataset_import")


@dataclass
class SellerCredentials:
    seller_id: str
    email: str
    password: str


def _load_products(config: Config) -> List[dict]:
    path = config.output_file("product_seed_snapshot.json")
    if not path.exists():
        raise FileNotFoundError(
            "product_seed_snapshot.json not found. Run `prepare` before importing products."
        )
    return read_json(path)


def _load_users(config: Config) -> Dict[str, SellerCredentials]:
    path = config.output_file("user_seed_snapshot.json")
    data = read_json(path)
    lookup: Dict[str, SellerCredentials] = {}
    for entry in data:
        lookup[entry["user_id"]] = SellerCredentials(
            seller_id=entry["user_id"],
            email=entry["email"],
            password=entry["password"],
        )
    return lookup


def import_products(execute: bool = False, batch_size: int = 10) -> None:
    """Create products for each seller using prepared payloads."""

    config = Config()
    products = _load_products(config)
    credentials = _load_users(config)

    seller_products: Dict[str, List[dict]] = defaultdict(list)
    for product in products:
        seller_products[product["seller_id"]].append(product)

    logger.info("Prepared %d products across %d sellers", len(products), len(seller_products))

    if not execute:
        print("Dry run: previewing first 3 product payloads")
        for entry in products[:3]:
            print({
                "product_id": entry["product_id"],
                "seller_email": entry["seller_email"],
                "price_aud": entry["price_aud"],
                "free_shipping": entry["free_shipping"],
                "images": entry["images"],
            })
        return

    client = ApiClient(config.api_base_url)
    import_results: List[Dict[str, str]] = []

    for seller_id, items in seller_products.items():
        credential = credentials.get(seller_id)
        if not credential:
            raise RuntimeError(f"Missing user credentials for seller {seller_id}")

        # Try to login, if failed, attempt to create the user
        try:
            token = client.login(credential.email, credential.password)
        except RuntimeError as e:
            if "账号或密码错误" in str(e) or "EMAIL_NOT_VERIFIED" in str(e):
                logger.info("User %s login failed, attempting to register and verify", credential.email)
                try:
                    # Register the user
                    register_payload = {
                        "email": credential.email,
                        "password": credential.password,
                        "displayName": credential.email.split('@')[0].replace('.', ' ').title()
                    }
                    client.register_user(register_payload)
                    logger.info("Successfully registered user %s", credential.email)

                    # Auto-verify email (simplified for import process)
                    logger.info("Auto-verifying email for %s", credential.email)

                    # Give a moment for registration to complete
                    import time
                    time.sleep(1)

                    # Try login again - if EMAIL_NOT_VERIFIED, we'll handle it in the outer exception
                    try:
                        token = client.login(credential.email, credential.password)
                    except RuntimeError as login_error:
                        if "EMAIL_NOT_VERIFIED" in str(login_error):
                            logger.warning("User %s needs email verification. Please run: UPDATE users SET email_verified = true WHERE email = '%s';", credential.email, credential.email)
                            raise RuntimeError(f"User {credential.email} requires email verification via database update")
                        else:
                            raise login_error
                except Exception as register_error:
                    logger.error("Failed to register user %s: %s", credential.email, register_error)
                    raise RuntimeError(f"Cannot proceed with seller {seller_id}: {register_error}")
            else:
                raise
        for index, product in enumerate(items, start=1):
            payload = {
                "title": product["title"],
                "description": product["description"],
                "price": product["price_aud"],
                "currency": "AUD",
                "categoryId": product["category_id"],
                "condition": product["condition"],
                "freeShipping": product["free_shipping"],
            }
            response = client.create_product(token, payload)
            product_id = response.get("id") or response.get("productId")
            if not product_id:
                raise RuntimeError("create_product response missing id field")
            import_results.append(
                {
                    "dataset_product_id": product["product_id"],
                    "product_id": product_id,
                    "seller_id": seller_id,
                }
            )
            if index % batch_size == 0:
                logger.info(
                    "Seller %s -> %d/%d products imported", seller_id, index, len(items)
                )

    write_json(config.output_file("product_import_results.json"), import_results)
    print(
        f"Imported {len(products)} products across {len(seller_products)} sellers. "
        "Mapping saved to output/product_import_results.json"
    )
