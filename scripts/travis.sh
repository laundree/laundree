#!/usr/bin/env bash

set -e

docker-compose -f docker-compose.test.yml build > ./build_output.txt || cat ./build_output.txt

if [ "$TRAVIS_BRANCH" != "master" ] || [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  export CODECLIMATE_REPO_TOKEN=''
fi

docker-compose -f docker-compsoe.test.yml up -d

docker-compose -f docker-compose.test.yml exec -T web npm test

echo "Test done. Stopping..."

docker-compose -f docker-compose.test.yml down

echo "Stopped."
