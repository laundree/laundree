#!/usr/bin/env bash

export PATH="$(npm bin):$PATH"

set -e

echo "Setting up tests"
npm run setup:test

echo "Linting"
npm run test:lint

echo "Flow"
npm run test:flow

npm run test:unit

nyc report

if [ -z "$SELENIUM_HOST" ] || [ "$SELENIUM_HOST" = "localhost" ]; then
    selenium-standalone install
    selenium-standalone start 2>/dev/null >/dev/null &
fi

if [ "$LAUNDREE_START_SERVER" != "false" ]; then
    npm run start:test &
fi


until $(curl --output /dev/null --silent --head --fail http://localhost:3000); do
    printf '.'
    sleep 1
done
sleep 5

npm run test:nightwatch
