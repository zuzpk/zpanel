#!/bin/bash

IS_RUNNING=$(systemctl is-active nginx 2>/dev/null | grep -q "^active" && echo "true" || echo "false")
VERSION=$(nginx -v 2>&1 | cut -d'/' -f2 | tr -d '\n\r')

echo "{"
echo "  \"isRunning\": $IS_RUNNING,"
echo "  \"version\": \"$VERSION\""
echo "}"