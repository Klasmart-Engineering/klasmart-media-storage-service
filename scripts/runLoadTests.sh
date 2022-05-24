#!/bin/sh

# *** REQUIRED ENVIRONMENT VARIABLES ***
# ECR_REGISTRY_PLUS_REPO
# PREV_VERSION_TAG
# CURR_VERSION_TAG

# Even though these are defined in the .env files, it won't use those because
# they're already defined by by an earlier step when pulling the ECR images.
export AWS_REGION=ap-northeast-2
export AWS_ACCESS_KEY_ID=minio
export AWS_SECRET_ACCESS_KEY=minio123

iterations=$1
if [ -z "$1" ]; then
    iterations=3
fi
duration=$2
if [ -z "$2" ]; then
    duration=10
fi

exit_if_failed() {
  if [ $1 -ne 0 ]; then
    exit $1
  fi
}

run_load_test() {
  version_tag=$1
  config_name=$2
  env_file_path=$3

  if [ -d "./node_modules_$version_tag" ]; then
    git checkout _$version_tag
    mv ./node_modules_$version_tag ./node_modules
  else
    git checkout tags/$version_tag -b _$version_tag
    npm ci
  fi

  docker run --add-host host.docker.internal:host-gateway \
    -d \
    --name=loadtest \
    --env-file $env_file_path \
    -p 8080:8080 \
    $ECR_REGISTRY_PLUS_REPO:$version_tag && sleep 5 && docker logs loadtest && docker top loadtest

  exit_if_failed $?
  npm run loadtest $version_tag $config_name $duration
  exit_if_failed $?
  docker stop loadtest
  docker rm loadtest
  mv ./node_modules ./node_modules_$version_tag
}

# =========================================================
# BASE CONFIG
# =========================================================

i=1
while [ "$i" -le $iterations ]; do
  run_load_test $PREV_VERSION_TAG baseConfig ./loadTesting/.env.baseConfig
  run_load_test $CURR_VERSION_TAG baseConfig ./loadTesting/.env.baseConfig
  i=$(( i + 1 ))
done
mv ./node_modules_$CURR_VERSION_TAG ./node_modules
npm run loadtest:compare $PREV_VERSION_TAG $CURR_VERSION_TAG baseConfig
