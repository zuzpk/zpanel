#!/bin/bash

SEARCH_ROOT="/etc/nginx"
ENABLED_DIR="/etc/nginx/sites-enabled"

# 1. Gather Global Nginx Status
IS_RUNNING=$(systemctl is-active nginx 2>/dev/null | grep -q "^active" && echo "true" || echo "false")
VERSION=$(nginx -v 2>&1 | cut -d'/' -f2 | tr -d '\n\r')

echo "{"
echo "  \"isRunning\": $IS_RUNNING,"
echo "  \"version\": \"$VERSION\","
echo "  \"blocks\": ["

# We use a global flag for the very first entry across ALL files
GLOBAL_FIRST=1

# 2. Find all files and process them
while read -r file; do
    
    CLEAN_CONTENT=$(sed 's/#.*//g' "$file" | tr -d '\r\t')

    # Logic: AWK outputs the raw data, and we handle the comma in the main shell loop
    # to avoid subshell scope issues.
    RESULTS=$(echo "$CLEAN_CONTENT" | awk -v fname="$file" '
    BEGIN { RS="server {" }
    NR > 1 {
        match($0, /server_name [^ \n;\}]+/)
        domain = (RSTART > 0) ? substr($0, RSTART + 12, RLENGTH - 12) : "unknown"

        match($0, /root [^ \n;\}]+/)
        root = (RSTART > 0) ? substr($0, RSTART + 5, RLENGTH - 5) : ""

        ssl = ($0 ~ /ssl/ || $0 ~ /443/) ? "true" : "false"

        match($0, /ssl_certificate [^ \n;\}]+/)
        cert = (RSTART > 0) ? substr($0, RSTART + 16, RLENGTH - 16) : ""

        match($0, /ssl_certificate_key [^ \n;\}]+/)
        key = (RSTART > 0) ? substr($0, RSTART + 20, RLENGTH - 20) : ""

        gsub(/[[:space:]]+/, "", domain); gsub(/[[:space:]]+/, "", root);
        gsub(/[[:space:]]+/, "", cert); gsub(/[[:space:]]+/, "", key);

        print domain "|" root "|" ssl "|" cert "|" key "|" fname
    }')

    # Process each server block found in the current file
    if [ -n "$RESULTS" ]; then
        while IFS='|' read -r domain root ssl cert key path; do
            
            # Comma Logic: If NOT the global first entry, print a comma
            if [ "$GLOBAL_FIRST" -eq 0 ]; then
                echo ","
            fi

            is_active="false"
            if [[ "$path" == *"/nginx.conf" ]] || [ -L "$ENABLED_DIR/$(basename "$path")" ]; then
                is_active="true"
            fi

            cat <<EOF
    {
      "id": "$(echo "$path" | md5sum | cut -d' ' -f1)",
      "domain": "$domain",
      "root": "$root",
      "isActive": $is_active,
      "sslEnabled": $ssl,
      "sslCertPath": "$cert",
      "sslKeyPath": "$key",
      "path": "$path"
    }
EOF
            GLOBAL_FIRST=0
        done <<< "$RESULTS"
    fi

done < <(find "$SEARCH_ROOT" -type f -name "*.conf")

echo ""
echo "  ]"
echo "}"