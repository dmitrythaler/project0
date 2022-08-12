#!/bin/bash

curl -H "Content-Type: application/json" \
  -d '{"name":"course-test-0","squidexId":"course-test-0:root","squidexSecret":"somethingugly"}' \
  -X POST http://localhost:3001/api/v1/course | jq


