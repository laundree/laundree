#!/usr/bin/env bash

set -e

docker-compose -f docker-compose.test.yml build > ./build_output.txt || cat ./build_output.txt

docker-compose -f docker-compose.test.yml up -d

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
    docker-compose -f docker-compose.test.yml run --entrypoint './scripts/test-docker.sh' -e CODECLIMATE_REPO_TOKEN="$CODECLIMATE_REPO_TOKEN" web
else
    docker-compose -f docker-compose.test.yml run --entrypoint './scripts/test-docker.sh' web
fi

echo "Test done. Stopping..."

docker-compose -f docker-compose.test.yml down

echo "Stopped."
