#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MVNW="$ROOT_DIR/backend/mvnw"

CORE_LIBRARY=common-service

APP_SERVICES=(
  user-service
  product-service
  order-service
  review-service
  chat-service
  file-service
  gateway-service
)

SKIP_BUILD=0
EXTRA_ARGS=("$@")

if [[ "${EXTRA_ARGS[0]:-}" == "--skip-build" ]]; then
  SKIP_BUILD=1
  EXTRA_ARGS=("${EXTRA_ARGS[@]:1}")
fi

cd "$ROOT_DIR/backend"

if [[ $SKIP_BUILD -eq 0 ]]; then
  echo "[run-backend-local] Building $CORE_LIBRARY (install to local repo)"
  "$MVNW" -pl "$CORE_LIBRARY" -am -DskipTests clean install

  MODULE_LIST=$(IFS=,; echo "${APP_SERVICES[*]}")
  echo "[run-backend-local] Building services: $MODULE_LIST"
  "$MVNW" -pl "$MODULE_LIST" -am -DskipTests clean compile
else
  echo "[run-backend-local] Skip build per --skip-build"
fi

PIDS=()

cleanup() {
  if [[ ${#PIDS[@]} -gt 0 ]]; then
    echo "\n[run-backend-local] Stopping services..."
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" >/dev/null 2>&1 || true
      fi
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

for svc in "${APP_SERVICES[@]}"; do
  echo "[run-backend-local] Starting $svc"
  "$MVNW" -pl "$svc" spring-boot:run -Dspring-boot.run.profiles=local "${EXTRA_ARGS[@]}" &
  PIDS+=($!)
  sleep 1
done

echo "\n[run-backend-local] All services launched. 按 Ctrl+C 停止。"

wait -n
echo "[run-backend-local] 某个服务已退出，等待剩余服务结束..."
wait
