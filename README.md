# Project Zero

Monorepo with Typescript and Yarn workspaces.<br />
This is a demo/boiler-plate started as a spin-off of my recent project.

## Code

* Yarn workspaces
* Monorepo
* Typescript

### Workspaces

The project consists of 4 worspaces:
* `@p0/common` contains a code and type definistions shared between all parts of the project;
* `@p0/dal` is a Data Access Layer - database access, models and entities definistions;
* `@p0/api` ia a main API;
* `@p0/fe` is a frontend part;


```
# yarn workspaces info
{
  "@p0/api": {
    "location": "api",
    "workspaceDependencies": [
      "@p0/common",
      "@p0/dal"
    ],
    "mismatchedWorkspaceDependencies": []
  },
  "@p0/dal": {
    "location": "dal",
    "workspaceDependencies": [
      "@p0/common"
    ],
    "mismatchedWorkspaceDependencies": []
  },
  "@p0/common": {
    "location": "common",
    "workspaceDependencies": [],
    "mismatchedWorkspaceDependencies": []
  },
  "@p0/fe": {
    "location": "frontend",
    "workspaceDependencies": [
      "@p0/common"
    ],
    "mismatchedWorkspaceDependencies": []
  }
}
```

## Typescript

Take a look at `tools/tsconfig.build.json` and `tools/tsconfig.workspaces.json`. They are being referrenced from every workspace's own ts configs and they are bases for dev and build ts compilations.

## Dev-ops infrastructure

The `tools/` folder contains
The docker config files for the dev and production environments, EBS configs for deployment and scripts to create/update AWS/EBS infra to deply to. It also contains generated ECDSA key pairs for auth and TS dev/prod configs.


