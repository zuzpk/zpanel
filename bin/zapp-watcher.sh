#!/bin/bash

SYSTEMD_DIR="/etc/systemd/system"

inotifywait -m "$SYSTEMD_DIR" -e create -e delete -e moved_to -e moved_from |
    while read path action file; do
            APP_ID="${file#zapp_}"
            APP_ID="${APP_ID%.service}"

            EVENT="unknown"
            case "$action" in
                create|moved_to) EVENT="added" ;;
                delete|moved_from) EVENT="removed" ;;
            esac

            curl -X POST "http://localhost:2082/_/apps/app_service_modified" \
                 -H "Content-Type: application/json" \
                 -d "{\"appId\":\"$APP_ID\",\"event\":\"$EVENT\",\"file\":\"$file\"}" \
                 --max-time 5 || true
    done
