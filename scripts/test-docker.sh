#!/usr/bin/env bash

set -e

./node_modules/.bin/istanbul cover ./node_modules/.bin/gulp test:docker
./node_modules/.bin/gulp coverage:send
