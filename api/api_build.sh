#!/bin/bash

CVT_NAME=api-build-converter
# use the image we built locally
#  (presumably converter built just before us...)
CVT_IMG=yipee-development/k10ehlive-converter
API_IMG=node:8.12.0-alpine
# sleep to make sure converter starts before we try to use it...
API_CMD="npm install && sleep 5 && npm test"

docker run -d --name ${CVT_NAME} ${CVT_IMG}
docker run --rm --link="${CVT_NAME}:converter" -e "UNIT_TESTING=true" -e "CVT_URL=http://converter:3000" -v "${PWD}:/data" -w="/data" ${API_IMG} sh -c "${API_CMD}"

TESTRC=$?

docker rm -f ${CVT_NAME}

REGISTRY=yipee-development
IMAGE=k10ehlive-api
if [ $TESTRC -eq 0 ]; then
    docker build -t $REGISTRY/$IMAGE .
    docker tag $REGISTRY/$IMAGE yipee-tools-spoke-cos.ca.com:5000/$IMAGE
else
    exit $TESTRC
fi
