#!/usr/bin/env bash

if [ "$TRAVIS_BRANCH" = "master" ];
    then docker-compose -f docker-compose.test.yml run -e CODECLIMATE_REPO_TOKEN=$CODECLIMATE_REPO_TOKEN sut
    else docker-compose -f docker-compose.test.yml run sut
fi
