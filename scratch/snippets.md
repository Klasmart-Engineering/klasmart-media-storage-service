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


STATS PROVIDER
```
public mapToOutput(statsInput: StatsInput) {
  const output: StatsOutput = {}
  for (const [key, value] of Object.entries(statsInput)) {
    output[key] = {}
    for (const [statKey, count] of Object.entries(value.counts)) {
      output[key][statKey] = count
    }
    for (const [statKey, set] of Object.entries(value.sets)) {
      output[key][statKey] = set.size
    }
  }
  return output
}
```


SETTING A DEFAULT VALUE FOR NEW COLUMN

```
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The commented out line below is technically sufficient, but we have to use a
    // workaround to accommodate "Capture Data Changes (AWS DMS)" limitations for
    // default values. This was requested by the data team.
    // await queryRunner.query(
    //   `ALTER TABLE "xapi_record" ADD "is_review" boolean NOT NULL DEFAULT false`,
    // )
    await queryRunner.query(`ALTER TABLE "xapi_record" ADD "is_review" boolean`)
    await queryRunner.query(`UPDATE "xapi_record" SET "is_review" = false`)
    await queryRunner.query(
      `ALTER TABLE "xapi_record" ALTER COLUMN "is_review" SET NOT NULL, ALTER COLUMN "is_review" SET DEFAULT false`,
    )
  }
```