#!/bin/bash

curl -v -H "Origin: http://some.origin.here" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3001/api/v1/course
