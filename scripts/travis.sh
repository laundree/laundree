#!/usr/bin/env bash

set -e

docker-compose -f docker-compose.test.yml build > ./build_output.txt || cat ./build_output.txt

docker-compose -f docker-compose.test.yml up -d

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
    docker-compose -f docker-compose.test.yml run \
        -e CODECLIMATE_REPO_TOKEN=$CODECLIMATE_REPO_TOKEN \
        web test:docker
else
    docker-compose -f docker-compose.test.yml run \
        web test:docker
fi


docker-compose -f docker-compose.test.yml down
