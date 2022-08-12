#!/bin/bash
set -e

KEY_OWN="Project Zero v0"
KEY_FILE_NAME="project0.key"
ENV_FILE_NAME="docker-compose.override.yml"

ssh-keygen -b 521 -t ecdsa -m PEM -C "$KEY_OWN" -f "$KEY_FILE_NAME" -q -N ""
openssl ec -in "$KEY_FILE_NAME" -pubout -outform PEM -out "${KEY_FILE_NAME}.pub"

PRIVATE=`sed -e "s/-----BEGIN EC PRIVATE KEY-----//" -e "s/-----END EC PRIVATE KEY-----//" -z -e "s/\n//g" ${KEY_FILE_NAME}`
PUBLIC=`sed -e "s/-----BEGIN PUBLIC KEY-----//" -e "s/-----END PUBLIC KEY-----//" -z -e "s/\n//g" ${KEY_FILE_NAME}.pub`

aws ssm put-parameter --name "/privateKey" --type "String" --overwrite --value "$PRIVATE"
aws ssm put-parameter --name "/publicKey" --type "String" --overwrite --value "$PUBLIC"

awk -i inplace "{gsub(/API_PUBLIC_KEY:.+/, \"API_PUBLIC_KEY: ${PUBLIC}\"); gsub(/API_PRIVATE_KEY:.+/, \"API_PRIVATE_KEY: ${PRIVATE}\")} {print}" $ENV_FILE_NAME

