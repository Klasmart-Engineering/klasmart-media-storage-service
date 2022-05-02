# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.1.28 (2022-05-02)


### Features

* **DAS-357:** add version endpoint ([1ee0646](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/1ee0646a9b360506dfa02b9b9444df2e9c331d41))

### 0.1.27 (2022-04-30)


### Features

* **DAS-346:** add daily count summary logs for easy access to insights ([#5](https://github.com/KL-Engineering/kidsloop-media-storage-service/issues/5)) ([d83e532](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/d83e53204fbaac9160c957e72fc959a2306e98c8))

### 0.1.26 (2022-04-21)


### Features

* reduce upload validation delay to 30s ([f247037](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/f24703783033a8b6f781ffce991987c1c905b059))

### 0.1.25 (2022-04-19)


### Features

* order metadata by createdAt column ([9803736](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/98037365a62942f989d9314916febbf132ab67e5))

### 0.1.24 (2022-04-15)


### Features

* **DAS-254:** add endpoint to query image metadata ([5f05dd4](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/5f05dd4cff885051e283f9e57858cf93c59b1620))


### Performance

* **DAS-329:** improve getRequiredDownloadInfo query caching ([af41141](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/af411416b20830f84debf4e08bff191f3adb694c))


### Refactor

* use ApplicationError, and organize folder structure ([c395f7b](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/c395f7b3ddfee11cbd7d38f6c0b78f57b48f3362))
* modify cache keys to have consistent format ([98b243d](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/98b243d88f68554b2957019c000a7ddf1b36ab33))

### 0.1.23 (2022-04-12)


### Features

* only log error stack when LOG_LEVEL is 'silly' ([5ab1340]https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/5ab13408eeaa5b9f5a9749297e47469863fdd7e4))


### Refactor

* refactor: use default imports where applicable ([3325b64](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/3325b64d55c7050cf078cb841afb91196bc51e38))

### [0.1.22](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.21..v0.1.22) (2022-04-11)


### Features

* add error logger to mercurius config ([78d20cc](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/78d20cc023b183c0f1e199d8ba25d50a2dfdf58d))


### Performance

* **DAS-329:** add context caching ([9909964](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/9909964487ce21a09e094407385d2a688ec0ed09))
* execute key pair provider ops concurrently ([093e957](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/093e957562b63d33b626b669dd8f3b75d0509c3e))

### [0.1.21](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.20..v0.1.21) (2022-04-07)


### Features

* **H5P-555:** use classActiveUserId for media events ([4979b2d](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/4979b2d78753af259f7cba2dbbc29aa3ff8f6307))


### Refactor

* **bench:** fix rawResults folder name: caching -> baseConfig ([daf7dcb](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/daf7dcb54f939042d8c8ce95df6c1b78daebcce4))


### Performance

* **DAS-329:** add metadata and download info caching ([4ed03f5](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/4ed03f548a9f011d38926dfeb115c50f8d015f80))

### [0.1.20](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.19..v0.1.20) (2022-04-04)


### Bug Fixes

* **DAS-328:** server key pair race condition ([fd176d8](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/fd176d8ebadeac2540459e870a7dc6b863e11e20))


### Refactor

* move helpers and queries from tests directory to helpers ([c161679](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/c16167925d33954c45ea8a9f2de045ce7537cca0))

### [0.1.19](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.18..v0.1.19) (2022-03-29)


### Features

* authorize participant teachers to download ([06deddd](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/06deddd68bb8989b7ee374ac2a757d59c9cb26eb))


### Refactor

* rename variable to be more accurate ([656baf8](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/656baf885619d3704a5a0343c85fd42c8bcbe6e0))

### [0.1.18](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.17..v0.1.18) (2022-03-29)

### [0.1.17](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.16..v0.1.17) (2022-03-29)


### Features

* **s3:** only ignore error if error.name is 'NoSuchKey' ([7b0f97d](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/7b0f97d01c605a7203f514db491f967939689757))

### [0.1.16](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.15..v0.1.16) (2022-03-22)


### Features

* introduce caching + refactoring ([269d825](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/269d825566f205b2e862ef76d8d9d0b73da37e1e))

### [0.1.15](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.14..v0.1.15) (2022-03-21)


### Features

* type-safe process.env + cors tests ([f5b5af2](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/f5b5af2d63f9531ea38dede241ce28532194715a))


### Bug Fixes

* permission check error ([5cc73f9](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/5cc73f9ddfd5a11a49185e298f82e0ee175e0b67))


### Refactor

* abtract metadata repo and add typeorm implementation ([7d2d3ee](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/7d2d3ee90afc976a89d3a2b135610dc045eb66e8))

### [0.1.14](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.13..v0.1.14) (2022-03-18)


### Features

* use same health check endpoint for apollo and fastify ([cd3deea](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/cd3deeab9783b51ad2fe151036dbd428ed9d0796))

### [0.1.13](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.12..v0.1.13) (2022-03-18)


### Bug Fixes

* health check fails ([971c282](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/971c282cb0767197751e3a0ba1110eee8f12949a))

### [0.1.12](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.11..v0.1.12) (2022-03-18)


### Features

* enable migrations ([f50e942](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/f50e9423a84b91af0eeec482bfef0dd816bd4c09))

### [0.1.11](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.10..v0.1.11) (2022-03-18)


### Bug Fixes

* error Cannot find module 'node-fetch' ([1c98454](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/1c984544db0e68a3111aca1bfff9d3b672935591))

### [0.1.10](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.9..v0.1.10) (2022-03-18)


### Features

* add updateAt column and a roomId index ([ad18b66](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/ad18b66457a4a0823197543f6a4ac7528ab216f9))
* **DAS-301:** switch from Apollo Server to Fastify+Mercurius ([ce9c47b](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/ce9c47b1011b62fe72a3d4ec3d476a22a2884a27))
* move setMetadata logic to getUploadInfo ([cb3b5b8](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/cb3b5b8adac45c105a60ddec10ac4c0214f9ea27))
* use aws sdk v3 ([56a657e](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/56a657e9e66d79876168c0a7c1cf2284218f221e))

### [0.1.9](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.8..v0.1.9) (2022-03-11)


### Features

* add db init migration ([9f56fc9](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/9f56fc9a6259f3b1a6db63930af56740e5875fdb))
* generalize service to work with different types of media ([da44e41](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/da44e4172d038eb8376fa86381d6cc673f8653da))


### Refactor

* remove unused TypeGraphQL auth checker ([6182be8](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/6182be8efdb27690ac4e6a436bd3f29a5b3ba1f0))
* simplify s3 sslEnabled ([a500483](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/a5004835de550def1286622e38596850564402cf))
* use snake case db column names ([975e56c](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/975e56ca9e9ff3711dcf845c1abb62c007abc6a4))

### [0.1.8](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.7..v0.1.8) (2022-03-03)


### Bug Fixes

* error saving private key ([4d2f9c0](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/4d2f9c0d941099a7f5f564fde933170450a97ca2))

### [0.1.7](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.6..v0.1.7) (2022-03-03)


### Bug Fixes

* organization permission check error ([3faead0](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/3faead0009950c40e7829e470a9352924cd38cdf))

### [0.1.6](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.5..v0.1.6) (2022-02-25)


### Bug Fixes

* empty audio list when h5pSubId is undefined ([ad5ec8c](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/ad5ec8cfdd60207c6144b4be51dbc6b05c0cad81))
* schedule api unauthorized error ([fb8612a](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/fb8612a4ad42b36cde86d303e29b600ae066ade5))

### [0.1.5](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.4..v0.1.5) (2022-02-25)


### Bug Fixes

* id no longer part of schedule api reponse ([8222bf5](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/8222bf547cafe9e0a454bca01bf09b95402797e9))

### [0.1.4](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.3..v0.1.4) (2022-02-24)


### Refactor

* add more debug logging ([78b37a9](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/78b37a9031d1823006f68459662c64dd5b1e3319))

### [0.1.3](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.2..v0.1.3) (2022-02-22)


### Performance

* **db:** use simple insert query instead of save ([dcbffe0](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/dcbffe014e0082236d2f72cf2f25c57389785ed9))


### Refactor

* improve permission api error logging ([8eb03c0](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/8eb03c08cf65709c53b173f61720bebe30e06f6f))
* logger naming consistency ([1fe6e2a](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/1fe6e2afd17cdf25aeafb19896bed8eaaf215c52))
* organize providers into folder ([dd710e1](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/dd710e1dcef460a448a8d66299831f0fc40ed821))

### [0.1.2](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.1..v0.1.2) (2022-02-21)


### Features

* turn off introspection in production ([f15803e](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/f15803eb4ec83a2b3e6d8f74776df5f3554f03e6))


### Bug Fixes

* wrong graphql return type (permission api) ([406307b](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/406307bd48d825fc37f62731d478a7f337627f0d))


### Performance

* enable TypeGraphQL "simpleResolvers" ([0af29c3](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/0af29c3967ebee24c6c649828a02c579065e4651))

### [0.1.1](https://github.com/KL-Engineering/kidsloop-media-storage-service/compare/v0.1.0..v0.1.1) (2022-02-18)


### Features

* **H5P-328:** add authorization for download requests ([c9d92e2](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/c9d92e2e0a32b7094145b8fcbed417e071cf7179))


### Bug Fixes

* replace temporary permission name with the actual name ([62df1df](https://github.com/KL-Engineering/kidsloop-media-storage-service/commit/62df1dfdb5e8340db2990da788ba7770a0967a40))

## 0.1.0 (2022-02-11)


### Features

* initial implementation
