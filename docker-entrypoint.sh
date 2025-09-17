#!/bin/sh

# Create assets directory if it doesn't exist
mkdir -p /usr/share/nginx/html/assets

# Create environment configuration file for Angular
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "apiUrls": {
    "userApi": "${USER_API_URL:-http://localhost:5010}",
    "gameLibraryApi": "${GAME_LIBRARY_API_URL:-http://localhost:5011}",
    "paymentsApi": "${PAYMENTS_API_URL:-http://localhost:5000}"
  }
}
EOF

echo "Configuration created:"
cat /usr/share/nginx/html/assets/config.json

# Start nginx
exec nginx -g "daemon off;"
