#!/usr/bin/env bash

set -e

docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
docker build -t laundree/laundree:${TRAVIS_COMMIT} --build-arg NODE_ENV=production .
docker push laundree/laundree:${TRAVIS_COMMIT}

BRANCH=${TRAVIS_BRANCH} TAG=${TRAVIS_COMMIT} envsub < kube/laundree.yml > laundree-deployment.yml

~/google-cloud-sdk/bin/gcloud container clusters get-credentials cluster-1 \
    --zone europe-west1-b --project laundree-io
~/google-cloud-sdk/bin/kubectl apply -f laundree-deployment.yml
