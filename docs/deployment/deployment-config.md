# Backend Deployment Configuration

This document lists the environment variables expected by the KoalaSwap backend services after the configuration sync. Defaults shown here are safe for local development; production deployments must override them as appropriate.

## Profiles Overview
- `application.yml`: now contains the same structure as the former `application-local.yml`, but every external dependency is parameterised with environment variables and docker-friendly hostnames.
- `application-local.yml`: kept for the `local` profile (`SPRING_PROFILES_ACTIVE=local`) and still carries the baked-in sample credentials you used while bootstrapping. Leave it untouched per current requirement, but plan to rotate any real secrets before launch.

Unless a profile is specified, each service will read the values from `application.yml` with the defaults listed below. In containerised environments, prefer setting the variables explicitly even if the defaults match your topology.

## Shared Environment Variables
| Variable | Default | Description |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/koalaswap_dev` | JDBC URL for Postgres (override host/DB name in non-compose setups). |
| `SPRING_DATASOURCE_USERNAME` | `koalaswap` | Postgres username. |
| `SPRING_DATASOURCE_PASSWORD` | `secret` | Postgres password. |
| `SPRING_DATA_REDIS_HOST` | `redis` | Redis hostname for token freshness cache and pub/sub. |
| `SPRING_DATA_REDIS_PORT` | `6379` | Redis port. |
| `APP_JWT_SECRET` | *(empty)* | Shared HS256 signing key. **Must** be a 256-bit random string in production. |
| `APP_JWT_ISSUER` | `koalaswap` | JWT issuer (services that require it). |
| `APP_JWT_ACCESS_TTL_MS` | `900000` | Access token TTL (milliseconds) used by user-service. |
| `APP_JWT_ACCESS_MINUTES` | `60` | Access token TTL (minutes) in services that use minute granularity. |
| `APP_TOKEN_FRESHNESS_USE_REDIS` | `true` (most services) | Toggle for Redis-based token-version provider. Set to `false` if Redis is unavailable. |
| `APP_TOKEN_FRESHNESS_TTL_SEC` | `8` | L1 cache TTL for token versions. |
| `APP_TOKEN_FRESHNESS_CHANNEL` | `auth:pv:changed` | Redis pub/sub channel for token version bumps. |
| `AWS_REGION` | `ap-southeast-2` | AWS region used by S3-related services. |
| `S3_BUCKET` | `koalaswap` | Target S3 bucket. |
| `CDN_BASE` | `https://d3367sa0s3hyt3.cloudfront.net` | CDN base URL for serving assets. |
| `AWS_PRESIGNED_MINUTES` | `15` | Expiry for generated pre-signed URLs. |
| `SERVER_PORT` | Varies by service | Override container port when needed (compose should use target 8080/8081 etc.). |

## User Service (`backend/user-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `12649` | Bind port (override when running behind gateway). |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` | SMTP host. |
| `SPRING_MAIL_PORT` | `587` | SMTP port. |
| `APP_MAIL_USERNAME` | *(empty)* | SMTP username; also used as default sender. |
| `APP_MAIL_PASSWORD` | *(empty)* | SMTP password/app-specific token. |
| `APP_MAIL_FROM` | `${APP_MAIL_USERNAME}` | Override to customise sender address. |
| `APP_VERIFY_REDIRECT_BASE` | `http://localhost:4200/verified` | Frontend URL used after email verification. |
| `APP_RESET_FRONTEND_URL` | `http://localhost:4200` | Password reset redirect base. |
| `APP_FILE_SERVICE_BASE_URL` | `http://file-service:8080` | Internal URL for file-service integration. |
| `APP_USER_DEFAULT_AVATAR_URL` | `/assets/avatars/default-avatar.svg` | Default avatar asset. |
| `APP_USER_SERVICE_INTERNAL_BASE_URL` | `http://user-service:8080` | Self-reference for token freshness fallbacks. |
| `LOGGING_LEVEL_COM_KOALASWAP_COMMON_SECURITY` | `INFO` | Optional logging override. |

## Product Service (`backend/product-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `12648` | Bind port. |
| `APP_PRODUCT_MAX_IMAGES` | `8` | Business limit for uploaded product images. |
| `APP_USER_SERVICE_INTERNAL_BASE_URL` | `http://user-service:8080` | Token freshness HTTP fallback. |
| `APP_FILE_SERVICE_BASE_URL` | `http://file-service:8080` | Used for reusing uploaded assets. |
| `APP_AWS_UPLOAD_MAX_FILE_SIZE` | `10485760` | Max file size (bytes) for uploads. |
| `APP_AWS_UPLOAD_MAX_IMAGES` | `8` | Upload limit per product when generating pre-signed URLs. |
| `LOGGING_LEVEL_COM_KOALASWAP_PRODUCT_SECURITY` | `INFO` | Optional logging override. |

## Order Service (`backend/order-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `12650` | Bind port. |
| `APP_PRODUCT_SERVICE_INTERNAL_BASE_URL` | `http://product-service:8080` | Depends on product-service for product details. |
| `APP_USER_SERVICE_INTERNAL_BASE_URL` | `http://user-service:8080` | Token freshness HTTP fallback. |
| `APP_ORDER_PENDING_EXPIRE_MINUTES` | `30` | Payment timeout. |
| `APP_ORDER_EVENTS_CHANNEL` | `orders:completed` | Redis pub/sub channel for order completion events. |
| `LOGGING_LEVEL_COM_KOALASWAP_ORDER_SECURITY` | `INFO` | Optional logging override. |

## Review Service (`backend/review-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `12651` | Bind port. |
| `APP_ORDER_EVENTS_ENABLED` | `true` | Toggle Redis subscription for completed orders. |
| `APP_ORDER_EVENTS_CHANNEL` | `orders:completed` | Redis pub/sub channel. |
| `APP_USER_SERVICE_EXTERNAL_BASE_URL` | `http://user-service:8080` | External HTTP calls to user-service. |
| `APP_PRODUCT_SERVICE_EXTERNAL_BASE_URL` | `http://product-service:8080` | External HTTP calls to product-service. |
| `APP_USER_SERVICE_INTERNAL_BASE_URL` | `http://user-service:8080` | Token freshness fallback. |
| `APP_PRODUCT_SERVICE_INTERNAL_BASE_URL` | `http://product-service:8080` | Token freshness fallback. |
| `LOGGING_LEVEL_COM_KOALASWAP_REVIEW` | `INFO` | Optional logging override. |

## Chat Service (`backend/chat-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `12652` | Bind port. |
| `KOALASWAP_SERVICES_USER_BASE_URL` | `http://user-service:8080` | Legacy config keys still consumed by chat clients. |
| `KOALASWAP_SERVICES_PRODUCT_BASE_URL` | `http://product-service:8080` | Legacy config keys. |
| `KOALASWAP_SERVICES_ORDER_BASE_URL` | `http://order-service:8080` | Legacy config keys. |
| `CHAT_WS_ALLOW_ORIGINS` | `*` | Allowed origins for WebSocket handshakes; tighten for production. |
| `CHAT_ORDER_REDIS_CHANNEL` | `orders:status-changed` | Redis channel for order status streaming. |
| `APP_USER_SERVICE_INTERNAL_BASE_URL` | `http://user-service:8080` | Token freshness fallback. |
| `APP_PRODUCT_SERVICE_INTERNAL_BASE_URL` | `http://product-service:8080` | Token freshness fallback. |
| `APP_ORDER_SERVICE_INTERNAL_BASE_URL` | `http://order-service:8080` | Used for cross-service callbacks. |
| `APP_IMAGES_PLACEHOLDER_PRODUCT` | `https://static.example.com/img/placeholder-product.png` | CDN asset for placeholder images. |
| `LOGGING_LEVEL_ROOT`, `LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_WEB`, `LOGGING_LEVEL_ORG_HIBERNATE_SQL`, `LOGGING_LEVEL_COM_KOALASWAP_COMMON_SECURITY` | `INFO` | Logging overrides. |

## File Service (`backend/file-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `12647` | Bind port. |
| `APP_USER_SERVICE_INTERNAL_BASE_URL` | `http://user-service:8080` | Token freshness fallback. |
| `APP_FILE_…` variables | See defaults | Per-category file rules (size limits, storage prefixes, compression toggles). |
| `LOGGING_LEVEL_COM_KOALASWAP_FILE` | `INFO` | Optional logging override. |

## Gateway Service (`backend/gateway-service`)
| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `18080` | Bind port for Spring Cloud Gateway. |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5177,http://localhost:4200` | Comma-separated allowlist for CORS. |
| `USER_SERVICE_URL` | `http://localhost:12649` | Downstream user-service (switch to service DNS in Docker/K8s). |
| `PRODUCT_SERVICE_URL` | `http://localhost:12648` | Downstream product-service. |
| `ORDER_SERVICE_URL` | `http://localhost:12650` | Downstream order-service. |
| `REVIEW_SERVICE_URL` | `http://localhost:12651` | Downstream review-service. |
| `CHAT_SERVICE_URL` | `http://localhost:12652` | Downstream chat REST endpoints. |
| `CHAT_WS_URL` | `http://localhost:12652` | WebSocket/SockJS endpoint. |
| `FILE_SERVICE_URL` | `http://localhost:12647` | Downstream file-service. |

## Sensitive Credentials Status
Per current instruction, the `application-local.yml` files still contain the historical sample credentials (SMTP password, JWT secret, etc.). They are ignored by the default profile but remain in the repository. Before launch:
1. Generate new production secrets (SMTP/SendGrid tokens, JWT key, AWS credentials) and provide them via environment variables or your secrets manager.
2. Decide whether to rotate or purge the legacy credentials from local configs and git history when convenient. Mark this as a post-launch TODO if it cannot happen immediately.

## Next Steps
- Wire these variables into your container orchestrator or CI/CD secrets store.
- Update `infra/docker-compose.yml` in the next phase to reference the same environment variable names so that every service starts with docker-native endpoints.
- Keep this document up to date whenever new configuration keys are introduced.
