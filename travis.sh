#!/usr/bin/env bash

if [ "$TRAVIS_BRANCH" = "master" ]; then
    docker-compose -f docker-compose.test.yml run -e CODECLIMATE_REPO_TOKEN=$CODECLIMATE_REPO_TOKEN sut
    curl https://intake.opbeat.com/api/v1/organizations/269d8b7d5eca44c2bb850e06a5316184/apps/71392cdc57/releases/ \
-H "Authorization: Bearer 1796548c377d87a9c59808b3a4c29b8bb0bc91b8" \
-d rev=`git log -n 1 --pretty=format:%H` \
-d branch=`git rev-parse --abbrev-ref HEAD` \
-d status=completed
else
    docker-compose -f docker-compose.test.yml run sut
fi
