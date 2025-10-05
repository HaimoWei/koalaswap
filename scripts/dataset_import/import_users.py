from __future__ import annotations

import logging
from typing import List

from .api import ApiClient
from .config import Config
from .utils import read_json


logger = logging.getLogger("dataset_import")


def _load_user_snapshot(config: Config, include_placeholders: bool) -> List[dict]:
    snapshot_path = config.output_file("user_seed_snapshot.json")
    if not snapshot_path.exists():
        raise FileNotFoundError(
            "user_seed_snapshot.json not found. Run `prepare` before importing users."
        )
    data = read_json(snapshot_path)
    if include_placeholders:
        return data
    return [entry for entry in data if entry.get("source") != "placeholder"]


def import_users(
    execute: bool = False,
    batch_size: int = 20,
    include_placeholders: bool = False,
) -> None:
    """Register seed users via the API (or preview payloads when dry-run)."""

    config = Config()
    users = _load_user_snapshot(config, include_placeholders)
    logger.info(
        "Prepared %d users for import (include_placeholders=%s)",
        len(users),
        include_placeholders,
    )

    if not execute:
        print("Dry run: listing first 5 payloads")
        for entry in users[:5]:
            print({k: entry[k] for k in ("email", "display_name", "password")})
        return

    client = ApiClient(config.api_base_url)
    imported_count = 0
    skipped_count = 0

    for index, user in enumerate(users, start=1):
        payload = {
            "email": user["email"],
            "password": user["password"],
            "displayName": user["display_name"],
        }

        try:
            client.register_user(payload)
            imported_count += 1
            if imported_count % batch_size == 0:
                logger.info("Imported %s users (skipped %s duplicates)", imported_count, skipped_count)
        except RuntimeError as e:
            error_msg = str(e)
            if "邮箱已经注册" in error_msg or "已注册" in error_msg or "EMAIL_ALREADY_EXISTS" in error_msg:
                logger.info("User %s already exists, skipping", user["email"])
                skipped_count += 1
                continue
            else:
                # 其他错误重新抛出
                logger.error("Failed to register user %s: %s", user["email"], error_msg)
                raise

    print(f"Import completed: {imported_count} new users imported, {skipped_count} duplicates skipped")
