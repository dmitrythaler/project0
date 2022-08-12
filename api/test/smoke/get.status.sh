#!/bin/bash
curl -X GET http://localhost:3001/api/v1/status/ | jq
