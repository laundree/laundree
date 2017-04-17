#!/usr/bin/env bash

set -e

docker-compose -f docker-compose.test.yml build > ./build_output.txt || cat ./build_output.txt

docker-compose -f docker-compose.test.yml up -d

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
    docker-compose -f docker-compose.test.yml run --entrypoint '' -e CODECLIMATE_REPO_TOKEN="$CODECLIMATE_REPO_TOKEN" web ./node_modules/.bin/istanbul cover ./node_modules/.bin/gulp test:docker
else
    docker-compose -f docker-compose.test.yml run --entrypoint '' web ./node_modules/.bin/istanbul cover ./node_modules/.bin/gulp test:docker
fi

echo "Test done. Stopping..."

docker-compose -f docker-compose.test.yml down

echo "Stopped."
