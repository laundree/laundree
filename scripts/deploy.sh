#!/usr/bin/env bash

set -e

docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
docker build -t laundree/laundree:${TRAVIS_COMMIT} --build-arg NODE_ENV=production .
docker push laundree/laundree:${TRAVIS_COMMIT}
