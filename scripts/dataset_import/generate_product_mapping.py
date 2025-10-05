#!/usr/bin/env python3
"""
Generate product mapping from database for image upload
Creates product_import_results.json from actual database records
"""

import psycopg2
import json
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 15433,
    'database': 'koalaswap_dev',
    'user': 'koalaswap',
    'password': 'secret'
}

def generate_product_mapping():
    """Generate product mapping from database"""

    # Load both complete and supplement product data
    dataset_dir = Path(__file__).resolve().parents[2] / "dataset"
    complete_path = dataset_dir / "products_complete.json"
    supplement_path = dataset_dir / "products_supplement.json"

    print(f"Loading complete dataset from: {complete_path}")
    with open(complete_path, 'r', encoding='utf-8') as f:
        complete_products = json.load(f)

    print(f"Loading supplement dataset from: {supplement_path}")
    with open(supplement_path, 'r', encoding='utf-8') as f:
        supplement_products = json.load(f)

    # Combine both datasets
    dataset_products = supplement_products  # supplement already contains complete + supplement
    print(f"Total dataset products: {len(dataset_products)}")

    # Create title -> dataset_id mapping
    title_to_dataset = {}
    for product in dataset_products:
        title_to_dataset[product['title']] = product['id']

    # Connect to database
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Query database products
    cursor.execute("SELECT id, title, seller_id FROM products")
    db_products = cursor.fetchall()

    print(f"Found {len(db_products)} products in database")

    # Generate mapping
    mapping = []
    matched = 0
    unmatched = 0

    for db_id, db_title, seller_id in db_products:
        if db_title in title_to_dataset:
            mapping.append({
                "dataset_product_id": title_to_dataset[db_title],
                "product_id": str(db_id),
                "seller_id": str(seller_id)
            })
            matched += 1
        else:
            print(f"Warning: No dataset match for title: {db_title[:50]}...")
            unmatched += 1

    print(f"Matched: {matched}, Unmatched: {unmatched}")

    # Save mapping
    output_path = Path(__file__).parent / "output" / "product_import_results.json"
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"Product mapping saved to: {output_path}")

    cursor.close()
    conn.close()

    return len(mapping)

if __name__ == "__main__":
    count = generate_product_mapping()
    print(f"Generated mapping for {count} products")