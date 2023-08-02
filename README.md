# Project0

Monorepo with Typescript and Yarn workspaces.<br />
This is a demo/boiler-plate started as a spin-off of my recent project.

## Code

* Yarn workspaces
* Monorepo
* Typescript

### Workspaces

The project consists of 4 worspaces:
* `@p0/common` contains a code and type definitions shared between all parts of the project;
* `@p0/dal` is a Data Access Layer - database access, models and entities definitions;
* `@p0/api` is a main API;
* `@p0/fe` is a frontend part;

```bash
~ yarn workspaces list --json
{"location":".","name":"project0"}
{"location":"api","name":"@p0/api"}
{"location":"common","name":"@p0/common"}
{"location":"dal","name":"@p0/dal"}
{"location":"frontend","name":"@p0/fe"}
```

## Typescript

Take a look at `tools/tsconfig.workspaces.json`. It's being referrenced from every workspace's own ts configs and they are bases for dev and build ts compilations.

## Install and run (development)

Run from console:
```bash
~ git clone git@github.com:dmitrythaler/p0.git
~ yarn install
~ yarn ts:build
~ tools/0.0.gen.keypair.js
~ yarn p0:mongo
~ yarn @dal dev:init-admin-user
~ yarn p0:stop
```
Open just generated `tools/secrets.dev.yml` file and update `MINIO_ROOT_PASSWORD` env variable. \
Then switch back to console:
```bash
~ yarn p0:dev
```

Then open http://localhost:3000 in your browser and login as `agentsmith@gmail.com` with `NeoMustDie` password.

## Dev-ops infrastructure

The `tools/` folder  \
TBD

