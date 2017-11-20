#!/usr/bin/env bash

if [ "$TRAVIS_BRANCH" = "beta" ]; then
  echo "Skipping tests on beta"
  exit 0
fi

set -e

if [ "$TRAVIS_BRANCH" != "master" ] || [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  export CODECLIMATE_REPO_TOKEN=''
fi

docker-compose -f docker-compose.test.yml up -d

docker-compose -f docker-compose.test.yml exec web bash -c '. /home/laundree/.nvm/nvm.sh && npm test'

echo "Test done. Stopping..."

docker-compose -f docker-compose.test.yml down

echo "Stopped."
