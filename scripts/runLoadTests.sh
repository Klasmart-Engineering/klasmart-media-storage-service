#!/bin/sh

docker run \
  -d \
  -p 9000:9000 \
  -e "MINIO_ACCESS_KEY=minio" \
  -e "MINIO_SECRET_KEY=minio123" \
  minio/minio server /data

docker run --add-host host.docker.internal:host-gateway \
  -d \
  --name=loadtest-baseConfig \
  --env-file ./loadTesting/.env.baseConfig \
  -p 8080:8080 \
  $ECR_REPOSITORY && sleep 5 && docker logs loadtest-baseConfig && docker top loadtest-baseConfig

npm run loadtest $VERSION_TAG baseConfig
exit_status=$?
if [ $exit_status -ne 0 ]; then
  exit $exit_status
fi
docker stop loadtest-baseConfig

docker run --add-host host.docker.internal:host-gateway \
  -d \
  --name=loadtest-noCaching \
  --env-file ./loadTesting/.env.noCaching \
  -p 8080:8080 \
  $ECR_REPOSITORY && sleep 5 && docker logs loadtest-noCaching && docker top loadtest-noCaching

npm run loadtest $VERSION_TAG noCaching
docker stop loadtest-noCaching
