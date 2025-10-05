#!/bin/bash
# KoalaSwap Nginx Setup Script
# Installs and configures Nginx

set -e

echo "=== KoalaSwap Nginx Setup ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (use sudo)"
  exit 1
fi

echo ""
echo "Step 1: Installing Nginx..."
apt-get update
apt-get install -y nginx

echo ""
echo "Step 2: Creating frontend directory..."
mkdir -p /opt/koalaswap/frontend-dist
mkdir -p /var/www/certbot

echo ""
echo "Step 3: Copying Nginx configuration..."
cp /opt/koalaswap/nginx/koalaswap.conf /etc/nginx/sites-available/koalaswap

echo ""
echo "Step 4: Creating temporary Nginx config (for initial SSL setup)..."
# Create a temporary config without SSL for initial certbot run
cat > /etc/nginx/sites-available/koalaswap-temp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name koalaswap.lightspot.uk api.koalaswap.lightspot.uk;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "Server is being set up. Please wait...";
        add_header Content-Type text/plain;
    }
}
EOF

echo ""
echo "Step 5: Enabling temporary configuration..."
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/koalaswap
ln -sf /etc/nginx/sites-available/koalaswap-temp /etc/nginx/sites-enabled/koalaswap-temp

echo ""
echo "Step 6: Testing Nginx configuration..."
nginx -t

echo ""
echo "Step 7: Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

echo ""
echo "=== Nginx Initial Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Run setup-ssl.sh to obtain SSL certificates"
echo "2. After SSL setup, enable the full Nginx config:"
echo "   sudo rm /etc/nginx/sites-enabled/koalaswap-temp"
echo "   sudo ln -s /etc/nginx/sites-available/koalaswap /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
