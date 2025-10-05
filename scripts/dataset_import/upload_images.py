from __future__ import annotations

import logging
import mimetypes
from pathlib import Path
from typing import Dict, List

import requests

from .api import ApiClient
from .config import Config
from .utils import read_json


logger = logging.getLogger("dataset_import")


def upload_images(execute: bool = False) -> None:
    """Upload images for imported products using product mapping."""

    config = Config()

    # Load product mapping from import results
    mapping_file = config.output_file("product_import_results.json")
    if not mapping_file.exists():
        raise FileNotFoundError("product_import_results.json not found. Import products first.")

    mappings = read_json(mapping_file)
    logger.info("Loaded %d product mappings", len(mappings))

    if not execute:
        print("Dry run: would upload images for first 3 products")
        for mapping in mappings[:3]:
            print(f"Product {mapping['product_id']}: dataset_id={mapping['dataset_product_id']}")
        return

    client = ApiClient(config.api_base_url)

    # Load dataset to get image info
    dataset_file = config.dataset_file("products_supplement.json")
    dataset_products = {p['id']: p for p in read_json(dataset_file)}

    uploaded_count = 0
    failed_count = 0

    for mapping in mappings:
        dataset_id = mapping["dataset_product_id"]
        product_id = mapping["product_id"]

        # Get dataset product info
        dataset_product = dataset_products.get(dataset_id)
        if not dataset_product:
            logger.warning("Dataset product %s not found", dataset_id)
            failed_count += 1
            continue

        # Check if product has images
        if not dataset_product.get('images'):
            logger.info("No images for product %s", dataset_id)
            continue

        # Get first image
        image_info = dataset_product['images'][0]
        image_filename = image_info['filename']
        image_path = config.images_dir / image_filename

        if not image_path.exists():
            logger.warning("Image file not found: %s", image_filename)
            failed_count += 1
            continue

        try:
            # Upload image using API
            success = _upload_product_image(client, product_id, image_path)
            if success:
                uploaded_count += 1
                logger.info("Uploaded %s for product %s", image_filename, product_id)
            else:
                failed_count += 1

        except Exception as e:
            logger.error("Failed to upload %s: %s", image_filename, e)
            failed_count += 1

    logger.info("Upload completed: %d successful, %d failed", uploaded_count, failed_count)


def _upload_product_image(client: ApiClient, product_id: str, image_path: Path) -> bool:
    """Upload a single image for a product."""
    try:
        # Get file info
        file_size = image_path.stat().st_size
        mime_type = mimetypes.guess_type(str(image_path))[0] or 'image/jpeg'

        # Request upload URL
        upload_response = client.session.post(
            f"{client.base_url}/api/images/upload-url",
            json={
                "fileName": image_path.name,
                "fileSize": file_size,
                "mimeType": mime_type
            },
            headers=client._get_headers(),
            timeout=30
        )

        if upload_response.status_code != 200:
            logger.error("Failed to get upload URL: %s", upload_response.text)
            return False

        upload_data = upload_response.json()
        upload_url = upload_data.get('uploadUrl')
        cdn_url = upload_data.get('cdnUrl')

        if not upload_url or not cdn_url:
            logger.error("Missing upload URL or CDN URL")
            return False

        # Upload file to S3
        with open(image_path, 'rb') as f:
            s3_response = client.session.put(
                upload_url,
                data=f,
                headers={'Content-Type': mime_type},
                timeout=60
            )

        if s3_response.status_code != 200:
            logger.error("S3 upload failed: %s", s3_response.status_code)
            return False

        # Associate image with product
        update_response = client.session.patch(
            f"{client.base_url}/api/products/{product_id}",
            json={"images": [cdn_url]},
            headers=client._get_headers(),
            timeout=30
        )

        return update_response.status_code == 200

    except Exception as e:
        logger.error("Upload error: %s", e)
        return False