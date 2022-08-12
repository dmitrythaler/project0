#!/bin/bash

curl -H "Content-Type: application/json" \
  -d '{"version":666}' \
  -X PATCH http://localhost:3001/api/v1/course/${1} | jq

