#!/bin/sh

export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_KEY" AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY"
export REPO=$DOCKER_REPO_URL/$DOCKER_REPO_NAME
export COMMIT_TAG=$(echo $BITBUCKET_COMMIT | cut -c1-7)
printf '"Git tag":"%s", "Git commit":"%s" "ECR repo":"%s"' $COMMIT_TAG $REPO
export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" $(aws sts assume-role --role-arn arn:aws:iam::942095822719:role/cross_account_role_ecr_push --role-session-name MySessionName --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" --output text))
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin $DOCKER_REPO_URL

docker build -t $DOCKER_REPO_NAME .

docker tag $DOCKER_REPO_NAME:latest $REPO:alpha
docker tag $DOCKER_REPO_NAME:latest $REPO:$VERSION_TAG
docker tag $DOCKER_REPO_NAME:latest $REPO:$COMMIT_TAG

docker push $REPO:alpha
docker push $REPO:$VERSION_TAG
docker push $REPO:$COMMIT_TAG