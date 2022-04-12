#!/bin/sh

docker run \
  -d \
  -p 9000:9000 \
  -e "MINIO_ACCESS_KEY=minio" \
  -e "MINIO_SECRET_KEY=minio123" \
  minio/minio server /data

docker run --add-host host.docker.internal:host-gateway \
  -d \
  --name=bench-baseConfig \
  --env-file ./benchmarking/.env.baseConfig \
  -p 8080:8080 \
  $ECR_REPOSITORY && sleep 5 && docker logs bench-baseConfig && docker top bench-baseConfig

npm run bench $VERSION_TAG baseConfig
exit_status=$?
if [ $exit_status -ne 0 ]; then
  exit $exit_status
fi
docker stop bench-baseConfig

docker run --add-host host.docker.internal:host-gateway \
  -d \
  --name=bench-noCaching \
  --env-file ./benchmarking/.env.noCaching \
  -p 8080:8080 \
  $ECR_REPOSITORY && sleep 5 && docker logs bench-noCaching && docker top bench-noCaching

npm run bench $VERSION_TAG noCaching
docker stop bench-noCaching
