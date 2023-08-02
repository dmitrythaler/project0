#!/usr/bin/bash
# set -e

DIR=`pwd`
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
MONGO_RUNNING=`docker ps|grep "p0-mongo"`
if [[ !"$MONGO_RUNNING" ]]; then
  echo "Mongo not running, starting..."
  docker-compose -p p0 --profile mongo \
    --env-file $SCRIPT_DIR/shared.dev.env \
    -f $SCRIPT_DIR/services.dev.yml \
    -f $SCRIPT_DIR/secrets.dev.yml \
    start
fi
echo "here we go ..."
LOG=dal node --loader ts-node/esm --experimental-specifier-resolution=node $SCRIPT_DIR/../dal/tools/init.root.user.ts


