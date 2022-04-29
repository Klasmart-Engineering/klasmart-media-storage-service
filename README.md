# KidsLoop Media Storage Service

[![codecov](https://codecov.io/gh/KL-Engineering/kidsloop-media-storage-service/branch/main/graph/badge.svg?token=VH7J9PO13A)](https://codecov.io/gh/KL-Engineering/kidsloop-media-storage-service)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

---

## Remarks

**Branching model**

- `feature/fix/etc` -> squash or rebase into `main`
- The main branch pipeline has a manual _release_ workflow.
- That workflow will build/push the docker image to ECR, and deploy to alpha.

📢 Follow the specification covered in [CONTRIBUTING.md](docs/CONTRIBUTING.md) 📢

---

## Local development

### Prerequisites

#### Installation

- Node v16.x.x
- Npm v6.x.x
- Docker (for Postgres, MinIO, and Redis)

#### Configuration

Copy/paste `.env.example` in the `localDev` directory, rename it to `.env`, and modify as necessary.

Run Docker Compose

```
docker compose -f localDev/docker-compose.yml --project-name media up
```

### Running

Ensure all dependencies are installed

```
npm install
```

Run

```
npm start
```

Run with hot reload

```
npm run dev
```

### Debugging

1. Navigate to the VS Code sidebar debug panel
2. Select `index.ts` from the dropdown
3. Click the green arrow debug button

When debugging tests, select `Mocha Current File` instead of `index.ts`, and make sure the target test file is the active tab.

### Testing

_Postgres database and MinIO buckets, dedicated to integration tests, will be created automatically._

Run Docker Compose (only needed for integration tests)

```
docker compose up -f localDev/docker-compose.yml
```

Run unit tests and generate coverage report (`./coverage_unit/lcov-report/index.html`)

```
npm run coverage:unit
```

Run integration tests and generate coverage report (`./coverage_integration/lcov-report/index.html`)

```
npm run coverage:integration
```

Run all tests and generate coverage report (`./coverage/lcov-report/index.html`)

```
npm test
```

_Tip: when debugging or focusing on a particular test or group of tests, append `.only` to `describe`, `context`, or `it` to only execute that scope of tests. But of course, make sure to undo it before making a commit._

---

## Migrations

Use `typeorm` to generate and run migrations.

Docs:

- [typeorm - Migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md)
- [typeorm - Using CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md)

Generate `ormConfig.json`

```sh
METADATA_DATABASE_URL=[database_url] npm run generate-orm-config
```

Generate migration

```sh
npm run typeorm migration:generate -- --config ormConfig.json -n [migration_name]
```

Manually run a migration

```sh
npm run typeorm migration:run -- --config ormConfig.json
```

Revert the last migration

```sh
npm run typeorm migration:revert -- --config ormConfig.json
```

---

## Deployment

### Alpha info

- Account name: kl-alpha-dev
- Cluster: kidsloop-alpha
- Service: kl-alpha-h5p-audio (this service used to only handle audio)
- Region: ap-northeast-2

_Where can I find the environment variable values for the alpha environment?_

Once you're granted access to the above account, head to the [service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/kl-alpha-h5p-audio/tasks), and you'll find the values specified in the latest task definition.
