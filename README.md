# Project Zero

Monorepo with Typescript and Yarn workspaces.<br />
This is a demo/boiler-plate started as a spin-off of my recent project.

## Code

* Typescript
* Yarn workspaces
* Monorepo

### Workspaces

`yarn workspaces info` shows us this project's structure:

```
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
* `@p0/common` contains a code shared between all parts of the project;
* `@p0/dal` is a Data Access Layer - database access, models and entities;
* `@p0/api` ia a main API;
* `@p0/fe` is a frontend part;



