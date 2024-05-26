# Project Zero

Monorepo with Typescript and Yarn workspaces.<br />
This is a demo/boiler-plate started as a spin-off of my recent project.

## Code

* Yarn workspaces
* Monorepo
* Typescript
* esbuild as compiler

### Workspaces

The project consists of 4 worspaces:
* `@p0/common` contains a code and type definitions shared between all parts of the project;
* `@p0/dal` is a Data Access Layer - database access, models and entities definitions;
* `@p0/api` is a main API;
* `@p0/fe` is a frontend part;


## Install and run (development)

Run from console:
```bash
~ git clone git@github.com:dmitrythaler/p0.git
~ yarn install
~ yarn ts:build
~ tools/0.0.gen.keypair.js
```
Open just generated `tools/secrets.dev.yml` file and update `MINIO_ROOT_PASSWORD` env variable. \
Then switch back to console:
```bash
~ yarn p0:dev
```

Then open http://localhost:3000 in your browser and login with credentials stored in `dal/models/player/user-dal.ts`.

## Tests

* node native for unit tests;
* [testcontainers](https://testcontainers.com/) for the integral ones

## Deployment infrastructure

TBD

