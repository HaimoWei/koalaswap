from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import os


@dataclass
class Config:
    """Centralised configuration for dataset preparation and import."""

    project_root: Path = field(default_factory=lambda: Path(__file__).resolve().parents[2])
    dataset_dir: Path = field(init=False)
    images_dir: Path = field(init=False)
    output_dir: Path = field(default_factory=lambda: Path(__file__).resolve().parent / "output")
    logs_dir: Path = field(default_factory=lambda: Path(__file__).resolve().parent / "logs")

    api_base_url: str = field(default_factory=lambda: os.getenv("KOALASWAP_API_BASE", "http://localhost:18080"))
    default_password: str = field(default_factory=lambda: os.getenv("KOALASWAP_SEED_PASSWORD", "weihaimo"))
    free_shipping_probability: float = 0.7
    price_exchange_rate: float = 4.7
    random_seed: int = 20250922

    dataset_part: str = "supplement"
    include_supplement: bool = True

    aws_bucket: str = field(default_factory=lambda: os.getenv("S3_BUCKET", ""))
    aws_region: str = field(default_factory=lambda: os.getenv("AWS_REGION", "ap-southeast-2"))

    def __post_init__(self) -> None:
        self.dataset_dir = self.project_root / "dataset"
        self.images_dir = self.dataset_dir / "images"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)

    def dataset_file(self, filename: str) -> Path:
        return self.dataset_dir / filename

    def output_file(self, filename: str) -> Path:
        return self.output_dir / filename

    def log_file(self, filename: str) -> Path:
        return self.logs_dir / filename
