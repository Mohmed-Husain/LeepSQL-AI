#!/bin/sh
# Runtime environment variable injection script
# This script replaces placeholder values in config.js with actual environment variables

CONFIG_FILE=/usr/share/nginx/html/config.js

# Replace placeholders with environment variables (use defaults if not set)
sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL:-http://localhost:8000}|g" $CONFIG_FILE
sed -i "s|__VITE_SUPABASE_URL__|${VITE_SUPABASE_URL:-}|g" $CONFIG_FILE
sed -i "s|__VITE_SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY:-}|g" $CONFIG_FILE

echo "✅ Runtime config injected:"
echo "   VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8000}"
echo "   VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-(not set)}"
echo "   VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+(set)}"

# Start nginx
exec nginx -g "daemon off;"
