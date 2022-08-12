#!/usr/bin/bash
set -e

IMAGE="project0:latest"
AWSID=`aws sts get-caller-identity --query "Account" --output text`
if [ -z "$AWSID" ]; then
    echo "Your AWS ID is not set"
    exit 1
fi
REPO="${AWSID}.dkr.ecr.eu-west-2.amazonaws.com"
echo "Your AWS ID $AWSID, image to publish $IMAGE, repository $REPO"

aws ecr get-login-password | docker login --username AWS --password-stdin ${REPO}
docker tag ${IMAGE} ${REPO}/${IMAGE}
docker push ${REPO}/${IMAGE}
