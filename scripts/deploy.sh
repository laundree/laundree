#!/usr/bin/env bash

set -e

docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
docker build images/base -t laundree/laundree_base:latest
docker build . -t laundree/laundree:latest
docker push laundree/laundree:latest
