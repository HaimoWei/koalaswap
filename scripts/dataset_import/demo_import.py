from __future__ import annotations

import logging
from typing import List

from .config import Config
from .dataset_loader import DatasetLoader
from .preparer import SeedPreparer
from .utils import write_json


logger = logging.getLogger("dataset_import")


def generate_demo(user_limit: int = 5, product_limit: int = 10) -> None:
    """Produce a demo subset and ensure preparation artefacts exist."""

    config = Config()
    loader = DatasetLoader(config)
    preparer = SeedPreparer(config)

    summary = preparer.run()
    logger.info("Preparation summary: %s", summary.to_dict())

    users: List = list(loader.load_users(include_supplement=config.include_supplement).values())[:user_limit]
    products = loader.load_products(part=config.dataset_part)[:product_limit]

    demo_output = {
        "user_sample": [u.data for u in users],
        "product_sample": [p.data for p in products],
    }
    write_json(config.output_file("demo_seed_report.json"), demo_output)
    print(
        f"Demo report generated with {len(users)} users and {len(products)} products."
    )
