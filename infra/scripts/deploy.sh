#!/bin/bash
# KoalaSwap Production Deployment Script
# Deploys the application to EC2

set -e

echo "=== KoalaSwap Production Deployment ==="

# Configuration
DEPLOY_DIR="/opt/koalaswap"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env"
FRONTEND_DIST="/opt/koalaswap/frontend-dist"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (use sudo)"
  exit 1
fi

# Check required files exist
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: docker-compose.prod.yml not found at $COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

echo ""
echo "Step 1: Creating data directories..."
mkdir -p /data/postgres
mkdir -p /data/redis
chmod 700 /data/postgres /data/redis

echo ""
echo "Step 2: Logging into ECR..."
aws ecr get-login-password --region ap-southeast-2 | \
    docker login --username AWS --password-stdin 143223323809.dkr.ecr.ap-southeast-2.amazonaws.com

echo ""
echo "Step 3: Pulling latest images from ECR..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml pull

echo ""
echo "Step 4: Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

echo ""
echo "Step 5: Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "Step 6: Waiting for services to be healthy..."
sleep 10

# Check service health
RETRIES=30
INTERVAL=5
for i in $(seq 1 $RETRIES); do
    echo "Checking service health (attempt $i/$RETRIES)..."

    if docker compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
        HEALTHY_COUNT=$(docker compose -f docker-compose.prod.yml ps | grep -c "healthy" || true)
        echo "  $HEALTHY_COUNT services are healthy"

        if [ "$HEALTHY_COUNT" -ge 9 ]; then
            echo "All services are healthy!"
            break
        fi
    fi

    if [ "$i" -eq "$RETRIES" ]; then
        echo "Warning: Not all services became healthy within the timeout period"
        docker compose -f docker-compose.prod.yml ps
    fi

    sleep $INTERVAL
done

echo ""
echo "Step 7: Verifying deployment..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Step 8: Checking gateway health..."
GATEWAY_HEALTH=$(curl -sf http://localhost:18080/actuator/health || echo "FAILED")
echo "Gateway health check: $GATEWAY_HEALTH"

echo ""
echo "=== Deployment Summary ==="
echo "Services running:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Verify frontend is accessible: https://koalaswap.lightspot.uk"
echo "2. Verify API is accessible: https://api.lightspot.uk/actuator/health"
echo "3. Check logs if needed: docker compose -f $COMPOSE_FILE logs -f [service-name]"
