#!/bin/sh

# *** REQUIRED ENVIRONMENT VARIABLES ***
# ECR_REGISTRY_PLUS_REPO
# PREV_VERSION_TAG
# CURR_VERSION_TAG

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
    git checkout $version_tag
    mv ./node_modules_$version_tag ./node_modules
  else
    git checkout tags/$version_tag -b $version_tag
    npm ci
  fi

  docker run --add-host host.docker.internal:host-gateway \
    -d \
    --name=loadtest \
    --env-file $env_file_path \
    -p 8080:8080 \
    $ECR_REGISTRY_PLUS_REPO:$version_tag && sleep 5 && docker logs loadtest && docker top loadtest

  exit_if_failed $?
  npm run loadtest $version_tag $config_name
  exit_if_failed $?
  docker stop loadtest
  docker rm loadtest
  mv ./node_modules ./node_modules_$version_tag
}

export AWS_REGION=ap-northeast-2
export AWS_ACCESS_KEY_ID=minio
export AWS_SECRET_ACCESS_KEY=minio123

# =========================================================
# BASE CONFIG
# =========================================================

run_load_test $PREV_VERSION_TAG baseConfig ./loadTesting/.env.baseConfig
run_load_test $CURR_VERSION_TAG baseConfig ./loadTesting/.env.baseConfig
run_load_test $PREV_VERSION_TAG baseConfig ./loadTesting/.env.baseConfig
run_load_test $CURR_VERSION_TAG baseConfig ./loadTesting/.env.baseConfig
npm run loadtest:compare $PREV_VERSION_TAG $CURR_VERSION_TAG baseConfig

# =========================================================
# NO CACHING CONFIG
# =========================================================

run_load_test $PREV_VERSION_TAG noCaching ./loadTesting/.env.noCaching
run_load_test $CURR_VERSION_TAG noCaching ./loadTesting/.env.noCaching
npm run loadtest:compare $PREV_VERSION_TAG $CURR_VERSION_TAG noCaching
