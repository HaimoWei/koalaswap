from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict

import boto3

from .config import Config


class S3Uploader:
    def __init__(self, config: Config) -> None:
        if not config.aws_bucket:
            raise ValueError("S3_BUCKET must be configured for image upload")
        self.config = config
        self.logger = logging.getLogger("dataset_import")
        self.client = boto3.client("s3", region_name=config.aws_region)

    def upload_file(self, local_path: Path, object_key: str, extra_args: Dict[str, str] | None = None) -> str:
        extra_args = extra_args or {"ACL": "public-read"}
        self.logger.info("Uploading %s to s3://%s/%s", local_path.name, self.config.aws_bucket, object_key)
        self.client.upload_file(str(local_path), self.config.aws_bucket, object_key, ExtraArgs=extra_args)
        return f"s3://{self.config.aws_bucket}/{object_key}"
