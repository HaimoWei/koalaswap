from __future__ import annotations

import re
from decimal import Decimal
from typing import Optional


ALLOWED_CONDITIONS = {"NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"}
_CONDITION_ALIAS = {"EXCELLENT": "LIKE_NEW"}
_PRICE_PATTERN = re.compile(r"¥\s*(\d+(?:\.\d+)?)")
_NUMBER_PATTERN = re.compile(r"(\d+(?:\.\d+)?)")


def normalize_condition(raw: str) -> str:
    value = _CONDITION_ALIAS.get(raw.upper(), raw.upper())
    if value not in ALLOWED_CONDITIONS:
        raise ValueError(f"Unsupported condition value: {raw}")
    return value


def parse_price_from_text(original_text: str) -> Optional[Decimal]:
    match = _PRICE_PATTERN.search(original_text)
    if match:
        return Decimal(match.group(1))
    # Fall back to first numeric chunk if currency symbol missing
    match = _NUMBER_PATTERN.search(original_text)
    if match:
        return Decimal(match.group(1))
    return None


def normalize_price(raw_price: int, original_text: str, exchange_rate: float) -> Decimal:
    amount_cny = parse_price_from_text(original_text)
    if amount_cny:
        aud = amount_cny / Decimal(exchange_rate)
    else:
        aud = Decimal(raw_price) / Decimal(100)
    if aud <= 0:
        raise ValueError("Price must be positive")
    return aud.quantize(Decimal("0.01"))
