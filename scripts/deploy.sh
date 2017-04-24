#!/usr/bin/env bash

set -e

docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
docker build --build-arg NODE_ENV=production -t laundree/laundree:latest .
docker push laundree/laundree:latest
