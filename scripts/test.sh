#!/usr/bin/env bash

function finish {
    pkill -f selenium-standalone
}
trap finish EXIT

export PATH="$(npm bin):$PATH"

set -e

npm run setup:test


npm run test:unit-covered

if [ -z "$SELENIUM_HOST" ] || [ "$SELENIUM_HOST" = "localhost" ]; then
    selenium-standalone install
    selenium-standalone start 2>/dev/null >/dev/null &
fi

npm run start:test-covered &
sleep 5

./scripts/run-nightwatch.js

nyc report

if [ -z "$CODECLIMATE_REPO_TOKEN" ]; then
    echo "No code climate token defined. Not uploading coverage."
else
    codeclimate-test-reporter < coverage/lcov.info
fi
