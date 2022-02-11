# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.1.0 (2022-02-11)


### Features

* add description field to the metadata ([0af278e](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/0af278e5023ac0d72b2785070542256757c327c5))
* add newrelic dependency and basic service integration ([d8784d3](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/d8784d32f9028e53b909633e42ad63c9d4661ac9))
* create database if it doesn't exist ([47ec4c7](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/47ec4c7b80615c12fbfc9ef9b77ab8e32069384d))
* disable graphql playground in production ([e8f26b8](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/e8f26b82e6d55faa3b37c9d558d0472a06dd3e72))
* expose mimeType in the GraphQL metadata ([2daef7a](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/2daef7a682fbea9eb01b173d93d17b1c3cc65d9b))
* integrate kidsloop-nodejs-logger ([174c09b](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/174c09bcc35f7ca12efb7059eb4704e01ded4978))
* modify architecture ([7261cc8](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/7261cc813a911b608ec49433a157eced19c803c2))
* redesign the public API a bit ([953ebbc](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/953ebbcc98acb18e8c9941ce6c6aeae7179dc61e))
* remove forRoom and forUser queries ([35f9402](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/35f94023b40accd06a61042ab17483b532bf666f))
* utilize live-authorization header ([540c35f](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/540c35f6d3df2776d275e4ed59002b048e0917cd))


### Bug Fixes

* add live-authorization as an allowed header ([54c0d83](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/54c0d83891563d356d30353cd73761ce01bddb1d))
* address issues encountered during alpha deployment ([e97c1e3](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/e97c1e3b11f71671acd93d3be9c7e48be1683c66))
* userId is undefined when trying to consume audio ([1612c10](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/1612c10b2a485615996af25c6da1650250444eee))


### Performance

* avoid creating unnecessary async state machine ([ffab330](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/ffab3302985e928e4febc7b040be2c664454f835))


### Refactor

* don't attempt Live auth token validation if undefined ([e7bf545](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/e7bf5455dccb8a17783d73c97a965d96e4a623d6))
* organize files into initialization folder ([627758b](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/627758b446225e405c904ed5d2feae92cc53c503))
* rename variables and tidy up authorization feature ([b937906](https://bitbucket.org/calmisland/kidsloop-audio-service/commits/b937906038450de17fe0f4fa7d5e81b4734f9640))
