from __future__ import annotations

import logging

import typer

from .config import Config
from .demo_import import generate_demo
from .import_products import import_products
from .import_users import import_users
from .preparer import SeedPreparer
from .upload_images import upload_images
from .utils import read_json, setup_logging


cli = typer.Typer(help="KoalaSwap dataset import CLI")


@cli.command()
def prepare(
    include_supplement: bool = typer.Option(False, help="Include supplement datasets"),
    dataset_part: str = typer.Option("complete", help="Data part to use: complete|supplement"),
    random_seed: int = typer.Option(20250922, help="Random seed for deterministic choices"),
) -> None:
    """Validate datasets and produce seed snapshot files."""

    config = Config()
    config.include_supplement = include_supplement
    config.dataset_part = dataset_part
    config.random_seed = random_seed

    logger = setup_logging(config.log_file("prepare.log"))
    logger.info("Starting preparation (part=%s, supplement=%s)", dataset_part, include_supplement)

    preparer = SeedPreparer(config)
    summary = preparer.run()
    typer.echo(f"Preparation completed: {summary.to_dict()}")


@cli.command()
def status() -> None:
    """Print a quick summary of generated artifacts."""
    config = Config()
    summary_path = config.output_file("summary.json")
    if not summary_path.exists():
        typer.echo("summary.json not found. Run `prepare` first.")
        raise typer.Exit(code=1)
    summary = read_json(summary_path)
    typer.echo(summary)


@cli.command("demo")
def demo_command(
    user_limit: int = typer.Option(5, help="Number of users in the demo subset"),
    product_limit: int = typer.Option(10, help="Number of products in the demo subset"),
) -> None:
    generate_demo(user_limit=user_limit, product_limit=product_limit)


@cli.command("import-users")
def import_users_command(
    execute: bool = typer.Option(False, help="Perform API calls instead of dry-run"),
    batch_size: int = typer.Option(20, help="Users per batch when executing"),
    include_placeholders: bool = typer.Option(
        False, help="Register placeholder sellers together with primary users"
    ),
) -> None:
    import_users(execute=execute, batch_size=batch_size, include_placeholders=include_placeholders)


@cli.command("import-products")
def import_products_command(
    execute: bool = typer.Option(False, help="Perform API calls instead of dry-run"),
    batch_size: int = typer.Option(10, help="Products per batch when executing"),
) -> None:
    import_products(execute=execute, batch_size=batch_size)


@cli.command("upload-images")
def upload_images_command(
    execute: bool = typer.Option(False, help="Perform uploads instead of validation only"),
) -> None:
    upload_images(execute=execute)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    cli()
