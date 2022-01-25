# KidsLoop Audio Service

[![codecov](https://codecov.io/bb/calmisland/kidsloop-audio-service/branch/main/graph/badge.svg?token=6DVLZB3HSY)](https://codecov.io/bb/calmisland/kidsloop-audio-service)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

[TOC]

---

## Remarks

**Branching model**

- `feature/fix/etc` -> `main`
- The main branch pipeline has a manual _version bump_ step.
- That step will build/push the docker image to ECR, and deploy to alpha.

📢 Follow the specification covered in [CONTRIBUTING.md](CONTRIBUTING.md) 📢

---

## Local development

### Prerequisites

#### Installation

- Node v16.x.x
- Npm v6.x.x
- Docker (for Postgres and MinIO)

#### Configuration

Copy/paste `.env.example` in the root directory, rename it to `.env`, and modify as necessary.

Copy/paste `.env.test.example` in the root directory, rename it to `.env.test`, and modify as necessary.

Create Postgres container

```
docker run -d --name=postgres -p 5432:5432 -e POSTGRES_PASSWORD=kidsloop -e POSTGRES_DB=audio_db postgres
```

OR if you already have a Postgres container that you'd like to reuse, just add a new database

```
docker container exec -it postgres psql -U postgres -c "create database audio_db;"
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

1. In your `.env` and `.env.test` files, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY equal to the values of MINIO_ROOT_USER and MINIO_ROOT_PASSWORD from the previous step.
2. Open your browser to http://localhost:9001.
3. Create 3 buckets for PUBLIC_KEY_BUCKET, PRIVATE_KEY_BUCKET, AUDIO_FILE_BUCKET in your `.env` file.

### Running

Ensure all dependencies are installed

```
npm install
```

Ensure Postgres is running

```
docker start postgres
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

### Testing

_Postgres database and MinIO buckets, dedicated to integration tests, will be created automatically._

Ensure Postgres and MinIO are running

```
docker start postgres minio
```

Run unit tests

```
npm run test:unit
```

Run integration tests

```
npm run test:integration
```

Run both unit and integration tests

```
npm test
```

Run both unit and integration tests, and generate a local coverage report. Results can be viewed at `/test-results/coverage.lcov/lcov-report/index.html`. Useful for finding lines/branches that aren't covered.

```
npm run test:coverage
```

_Tip: when debugging or focusing on a particular test or group of tests, append `.only` to `describe`, `context`, or `it` to only execute that scope of tests. But of course, make sure to undo it before making a commit._

---

## Deployment

We use the [Bitbucket Deployments](https://bitbucket.org/blog/introducing-bitbucket-deployments) feature for a nice overview of deployment history. The quality of the Jira integration depends on ticket IDs being included in commit messages, so it's important to make an effort to do so.

- The [Bitbucket view](https://bitbucket.org/calmisland/kidsloop-audio-service/addon/pipelines/deployments) can be accessed from the sidebar via the Deployments tab.
- The [Jira view](https://calmisland.atlassian.net/jira/software/c/projects/DAS/deployments?startDate=-3m&endDate=now) can be accessed from the sidebar of Jira via the Deployments tab.

### Alpha info

- Account name: Kidsloop Dev
- Cluster: kidsloop-alpha
- Service: kl-alpha-h5p-audio
- Region: ap-northeast-2

_Where can I find the environment variable values for the alpha environment?_

Once you're granted access to the above account, head to the [service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/kl-alpha-h5p-audio/tasks), and you'll find the values specified in the latest task definition.

---

## Recommended VS Code extensions

- [Jira and Bitbucket](https://marketplace.visualstudio.com/items?itemName=Atlassian.atlascode)
- [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
