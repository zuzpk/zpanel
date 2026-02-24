#!/bin/bash

# Define the port
PORT=3001

/usr/sbin/fuser -k $PORT/tcp

PNPM_PATH="/usr/bin/pnpm"

cd /home

echo "Starting server on port $PORT"

exec $PNPM_PATH dev