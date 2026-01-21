#!/bin/bash

PORT=$1

if [[ -z "$PORT" ]]; then
  echo "Usage: $0 <port-number>"
  exit 1
fi

echo "Opening TCP port $PORT..."

# Check if firewalld is installed and running
if command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
  echo "Using firewalld..."
  sudo firewall-cmd --permanent --add-port=${PORT}/tcp
  sudo firewall-cmd --reload

elif command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
  echo "Using ufw..."
  sudo ufw allow ${PORT}/tcp
else
  echo "firewalld | ufw not active or not found"
fi

echo "Done."
