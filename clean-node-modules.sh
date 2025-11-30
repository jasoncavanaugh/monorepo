#!/bin/bash

rm -rf node_modules && echo "Removed ./node_modules"
[ -d web ] && cd web && rm -rf node_modules && echo "Removed web/node_modules" && cd -
[ -d backend ] && cd backend && rm -rf node_modules && echo "Removed backend/node_modules" && cd -
[ -d mobile ] && cd mobile && rm -rf node_modules && echo "Removed mobile/node_modules" && cd -
