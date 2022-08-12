#!/bin/bash
set -e

DIR=`pwd`
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
cd ${SCRIPT_DIR}/eb
if eb list &>/dev/null; then
  echo 'Deploying new version...'
else
  echo 'the Application and env are not created yet...'
  cd $DIR
  exit 1
fi

# deploy eb app
eb deploy
