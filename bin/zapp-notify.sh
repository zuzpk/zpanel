#!/bin/bash

set -euo pipefail

SERVICE="$1"
APP_ID="${SERVICE#zapp_}"
APP_ID="${APP_ID%.service}"

# Clean variables: remove any control chars, trim whitespace
APP_ID=$(echo "$APP_ID" | tr -d '\r\n\t' | xargs)
SERVICE=$(echo "$SERVICE" | tr -d '\r\n\t' | xargs)

# Get clean status
if systemctl is-active --quiet "$SERVICE"; then
    STATUS="running"
elif systemctl is-failed --quiet "$SERVICE"; then
    STATUS="failed"
else
    STATUS="stopped"
fi

# Build valid JSON manually (safest way in bash)
JSON=$(printf '{"appId":"%s","service":"%s","status":"%s"}' \
    "$APP_ID" "$SERVICE" "$STATUS")

# Send to backend
curl -X POST "http://localhost:2082/_/apps/app_service_status_switched" \
     -H "Content-Type: application/json" \
     -d "$JSON" \
     --max-time 5 || true

