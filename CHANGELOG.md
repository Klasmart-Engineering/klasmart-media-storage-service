# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.1.24 (2022-04-15)

### 0.1.23 (2022-04-12)

### [0.1.22](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.22..v0.1.21) (2022-04-11)


### Features

* add error logger to mercurius config ([78d20cc](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/78d20cc023b183c0f1e199d8ba25d50a2dfdf58d))


### Performance

* **DAS-329:** add context caching ([9909964](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/9909964487ce21a09e094407385d2a688ec0ed09))
* execute key pair provider ops concurrently ([093e957](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/093e957562b63d33b626b669dd8f3b75d0509c3e))

### [0.1.21](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.21..v0.1.20) (2022-04-07)


### Features

* **H5P-555:** use classActiveUserId for media events ([4979b2d](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/4979b2d78753af259f7cba2dbbc29aa3ff8f6307))


### Refactor

* **bench:** fix rawResults folder name: caching -> baseConfig ([daf7dcb](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/daf7dcb54f939042d8c8ce95df6c1b78daebcce4))


### Performance

* **DAS-329:** add metadata and download info caching ([4ed03f5](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/4ed03f548a9f011d38926dfeb115c50f8d015f80))

### [0.1.20](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.20..v0.1.19) (2022-04-04)


### Bug Fixes

* **DAS-328:** server key pair race condition ([fd176d8](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/fd176d8ebadeac2540459e870a7dc6b863e11e20))


### Refactor

* move helpers and queries from tests directory to helpers ([c161679](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/c16167925d33954c45ea8a9f2de045ce7537cca0))

### [0.1.19](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.19..v0.1.18) (2022-03-29)


### Features

* authorize participant teachers to download ([06deddd](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/06deddd68bb8989b7ee374ac2a757d59c9cb26eb))


### Refactor

* rename variable to be more accurate ([656baf8](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/656baf885619d3704a5a0343c85fd42c8bcbe6e0))

### [0.1.18](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.18..v0.1.17) (2022-03-29)

### [0.1.17](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.17..v0.1.16) (2022-03-29)


### Features

* **s3:** only ignore error if error.name is 'NoSuchKey' ([7b0f97d](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/7b0f97d01c605a7203f514db491f967939689757))

### [0.1.16](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.16..v0.1.15) (2022-03-22)


### Features

* introduce caching + refactoring ([269d825](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/269d825566f205b2e862ef76d8d9d0b73da37e1e))

### [0.1.15](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.15..v0.1.14) (2022-03-21)


### Features

* type-safe process.env + cors tests ([f5b5af2](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/f5b5af2d63f9531ea38dede241ce28532194715a))


### Bug Fixes

* permission check error ([5cc73f9](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/5cc73f9ddfd5a11a49185e298f82e0ee175e0b67))


### Refactor

* abtract metadata repo and add typeorm implementation ([7d2d3ee](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/7d2d3ee90afc976a89d3a2b135610dc045eb66e8))

### [0.1.14](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.14..v0.1.13) (2022-03-18)


### Features

* use same health check endpoint for apollo and fastify ([cd3deea](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/cd3deeab9783b51ad2fe151036dbd428ed9d0796))

### [0.1.13](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.13..v0.1.12) (2022-03-18)


### Bug Fixes

* health check fails ([971c282](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/971c282cb0767197751e3a0ba1110eee8f12949a))

### [0.1.12](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.12..v0.1.11) (2022-03-18)


### Features

* enable migrations ([f50e942](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/f50e9423a84b91af0eeec482bfef0dd816bd4c09))

### [0.1.11](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.11..v0.1.10) (2022-03-18)


### Bug Fixes

* error Cannot find module 'node-fetch' ([1c98454](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/1c984544db0e68a3111aca1bfff9d3b672935591))

### [0.1.10](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.10..v0.1.9) (2022-03-18)


### Features

* add updateAt column and a roomId index ([ad18b66](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/ad18b66457a4a0823197543f6a4ac7528ab216f9))
* **DAS-301:** switch from Apollo Server to Fastify+Mercurius ([ce9c47b](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/ce9c47b1011b62fe72a3d4ec3d476a22a2884a27))
* move setMetadata logic to getUploadInfo ([cb3b5b8](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/cb3b5b8adac45c105a60ddec10ac4c0214f9ea27))
* use aws sdk v3 ([56a657e](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/56a657e9e66d79876168c0a7c1cf2284218f221e))

### [0.1.9](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.9..v0.1.8) (2022-03-11)


### Features

* add db init migration ([9f56fc9](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/9f56fc9a6259f3b1a6db63930af56740e5875fdb))
* generalize service to work with different types of media ([da44e41](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/da44e4172d038eb8376fa86381d6cc673f8653da))


### Refactor

* remove unused TypeGraphQL auth checker ([6182be8](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/6182be8efdb27690ac4e6a436bd3f29a5b3ba1f0))
* simplify s3 sslEnabled ([a500483](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/a5004835de550def1286622e38596850564402cf))
* use snake case db column names ([975e56c](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/975e56ca9e9ff3711dcf845c1abb62c007abc6a4))

### [0.1.8](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.8..v0.1.7) (2022-03-03)


### Bug Fixes

* error saving private key ([4d2f9c0](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/4d2f9c0d941099a7f5f564fde933170450a97ca2))

### [0.1.7](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.7..v0.1.6) (2022-03-03)


### Bug Fixes

* organization permission check error ([3faead0](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/3faead0009950c40e7829e470a9352924cd38cdf))

### [0.1.6](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.6..v0.1.5) (2022-02-25)


### Bug Fixes

* empty audio list when h5pSubId is undefined ([ad5ec8c](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/ad5ec8cfdd60207c6144b4be51dbc6b05c0cad81))
* schedule api unauthorized error ([fb8612a](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/fb8612a4ad42b36cde86d303e29b600ae066ade5))

### [0.1.5](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.5..v0.1.4) (2022-02-25)


### Bug Fixes

* id no longer part of schedule api reponse ([8222bf5](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/8222bf547cafe9e0a454bca01bf09b95402797e9))

### [0.1.4](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.4..v0.1.3) (2022-02-24)


### Refactor

* add more debug logging ([78b37a9](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/78b37a9031d1823006f68459662c64dd5b1e3319))

### [0.1.3](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.3..v0.1.2) (2022-02-22)


### Performance

* **db:** use simple insert query instead of save ([dcbffe0](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/dcbffe014e0082236d2f72cf2f25c57389785ed9))


### Refactor

* improve permission api error logging ([8eb03c0](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/8eb03c08cf65709c53b173f61720bebe30e06f6f))
* logger naming consistency ([1fe6e2a](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/1fe6e2afd17cdf25aeafb19896bed8eaaf215c52))
* organize providers into folder ([dd710e1](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/dd710e1dcef460a448a8d66299831f0fc40ed821))

### [0.1.2](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.2..v0.1.1) (2022-02-21)


### Features

* turn off introspection in production ([f15803e](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/f15803eb4ec83a2b3e6d8f74776df5f3554f03e6))


### Bug Fixes

* wrong graphql return type (permission api) ([406307b](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/406307bd48d825fc37f62731d478a7f337627f0d))


### Performance

* enable TypeGraphQL "simpleResolvers" ([0af29c3](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/0af29c3967ebee24c6c649828a02c579065e4651))

### [0.1.1](http://bitbucket.org/calmisland/kidsloop-audio-service/compare/v0.1.1..v0.1.0) (2022-02-18)


### Features

* **H5P-328:** add authorization for download requests ([c9d92e2](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/c9d92e2e0a32b7094145b8fcbed417e071cf7179))


### Bug Fixes

* replace temporary permission name with the actual name ([62df1df](http://bitbucket.org/calmisland/kidsloop-audio-service/commits/62df1dfdb5e8340db2990da788ba7770a0967a40))

## 0.1.0 (2022-02-11)


### Features

* initial implementation
