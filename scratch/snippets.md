Create Postgres container

```
docker run -d --name=postgres -p 5432:5432 -e POSTGRES_PASSWORD=kidsloop -e POSTGRES_DB=media_db postgres
```

OR if you already have a Postgres container that you'd like to reuse, just add a new database

```
docker container exec -it postgres psql -U postgres -c "create database media_db;"
```

Create MinIO container

```
docker run \
  -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minio" \
  -e "MINIO_ROOT_PASSWORD=minio123" \
  minio/minio server /data --console-address ":9001"
```

MinIO config

1. In your `.env` files, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY equal to the values of MINIO_ROOT_USER and MINIO_ROOT_PASSWORD from the previous step.
2. Open your browser to http://localhost:9001.
3. Create 3 buckets for PUBLIC_KEY_BUCKET, PRIVATE_KEY_BUCKET, MEDIA_FILE_BUCKET in your `.env` file.