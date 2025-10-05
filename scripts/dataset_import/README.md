# KoalaSwap Dataset Import Toolkit

This toolkit prepares KoalaSwap seed data so it matches the current database schema and is ready for API-based import. All generated artifacts stay inside this directory for easy review.

## 1. Environment Setup

```bash
# from project root
python3 -m venv .venv-import
source .venv-import/bin/activate  # Windows: .venv-import\Scripts\activate
pip install -r scripts/dataset_import/requirements.txt
```

Optional: copy `.env.sample` to `.env` and adjust API / AWS credentials. The CLI also reads standard environment variables when the file is absent.

## 2. Available Commands

```bash
python3 scripts/dataset_import/main.py --help
```

Key workflows:

- `prepare` — validate datasets, build placeholder seller accounts, normalise prices & conditions, and generate seed snapshot files under `output/`.
- `demo` — dry-run using a small subset (default 5 users / 10 products) to review payloads without hitting the API.
- `status` — print a quick summary of generated artifacts and dataset coverage.

When you are satisfied with the generated payloads you can progress to the actual import stage using `import-users`, `import-products`, and `upload-images`. These commands are implemented but disabled by default (dry-run) until you pass `--execute`. Review the docstring in each command before enabling execution.

## 3. Files Generated in `output/`

- `summary.json` — dataset counts, placeholder seller totals, validation flags.
- `seed_user_metadata.json` — extra profile fields not present in the schema (username, first/last name).
- `user_seed_snapshot.json` — payload-ready user list with default password and verification flags.
- `seed_seller_mapping.json` — generated accounts for missing sellers with consistent emails and temporary passwords.
- `product_seed_snapshot.json` — normalised product payloads (price, condition, free shipping decision, images).
- `product_import_results.json` — mapping between dataset product IDs and the UUIDs returned by the API (生成于 `import-products --execute`).
- `demo_seed_report.json` — written by `demo` to highlight the subset used for trial runs.
- `logs/` — execution logs organised per command.

## 4. Typical Workflow

```bash
# 1. Prepare artefacts
python3 scripts/dataset_import/main.py prepare

# 2. Inspect output/*.json and confirm values
python3 scripts/dataset_import/main.py status

# 3. Dry-run demo subset
python3 scripts/dataset_import/main.py demo

# 4. (Optional) Run full import when ready
python3 scripts/dataset_import/main.py import-users --include-placeholders --execute
python3 scripts/dataset_import/main.py import-products --execute
python3 scripts/dataset_import/main.py upload-images --execute
```

Each command accepts `--help` to view advanced flags (e.g. enabling supplement datasets, overriding random seed, or adjusting batch sizes).

## 5. Notes

- The toolkit never mutates the original files under `dataset/`.
- Default password for all generated accounts is `weihaimo`; placeholders reuse the same value.
- Random choices (free shipping) use a deterministic seed by default. Override with `--random-seed` if you need a different distribution.
- Placeholder seller emails follow the pattern `seed-seller+<uuid-prefix>@koalaswap.local` to avoid collisions.
- Image uploads expect exactly one image per product in the current dataset, but the pipeline is capable of sending multiple files if future crawls provide them. 上传流程会先调用 `request-upload` 获取预签名 URL，再执行 `PUT` 上传并通过 `upload-complete` 回写数据库。
- 运行 `upload-images --execute` 前，请确认 `output/product_import_results.json` 已由上一阶段生成，否则脚本会中止。

Review `DATASET_IMPORT_PLAN.md` for the broader end-to-end procedure once these preparation steps are complete.
