#!/usr/bin/bash
set -e

DIR=`pwd`
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
COMMIT_HASH=`git rev-parse --short HEAD`
TAG=`git tag | grep -E '^[0-9]' | sort -V | tail -1`

docker build \
  -t p0 \
  -f ${SCRIPT_DIR}/Dockerfile.api \
  --build-arg COMMIT_HASH=$COMMIT_HASH \
  --build-arg TAG=$TAG \
  --build-arg API_PORT=3001 \
  --build-arg WS_PORT=3002 .

