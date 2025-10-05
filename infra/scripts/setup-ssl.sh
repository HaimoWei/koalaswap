#!/bin/bash
# KoalaSwap SSL Certificate Setup Script
# Uses Let's Encrypt with Certbot

set -e

echo "=== KoalaSwap SSL Certificate Setup ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (use sudo)"
  exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Create directory for ACME challenge
mkdir -p /var/www/certbot

# Email for Let's Encrypt notifications
EMAIL="${LETSENCRYPT_EMAIL:-admin@koalaswap.lightspot.uk}"

echo ""
echo "Obtaining SSL certificate for koalaswap.lightspot.uk..."
certbot certonly --webroot \
    -w /var/www/certbot \
    -d koalaswap.lightspot.uk \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

echo ""
echo "Obtaining SSL certificate for api.koalaswap.lightspot.uk..."
certbot certonly --webroot \
    -w /var/www/certbot \
    -d api.koalaswap.lightspot.uk \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

echo ""
echo "=== SSL Certificates obtained successfully ==="
echo ""
echo "Certificate locations:"
echo "  - koalaswap.lightspot.uk: /etc/letsencrypt/live/koalaswap.lightspot.uk/"
echo "  - api.koalaswap.lightspot.uk: /etc/letsencrypt/live/api.koalaswap.lightspot.uk/"
echo ""
echo "Setting up auto-renewal..."

# Create renewal cron job
CRON_JOB="0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo "Auto-renewal configured (runs twice daily)"
echo ""
echo "=== Setup complete ==="
echo "Please reload Nginx: sudo systemctl reload nginx"
