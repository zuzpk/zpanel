#!/bin/bash

# Define the port
PORT=2082

/usr/sbin/fuser -k $PORT/tcp

PNPM_PATH="/usr/bin/pnpm"

cd /home/binance-bapu

echo "Starting server on port $PORT"

exec $PNPM_PATH dev