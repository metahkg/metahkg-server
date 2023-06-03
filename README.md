# Metahkg server

This is the Metahkg backend api. See the [metahkg repository](https://gitlab.com/metahkg/metahkg).

stable (master): [metahkg.org](https://metahkg.org)

dev build (dev): [dev.metahkg.org](https://dev.metahkg.org)

[![Nodejs](https://badges.aleen42.com/src/node.svg)](https://nodejs.org)
[![Typescript](https://badges.aleen42.com/src/typescript.svg)](https://www.typescriptlang.org/)

[![Gitlab](https://badges.aleen42.com/src/gitlab.svg)](https://gitlab.com/metahkg/metahkg-server)
[![Github](https://badges.aleen42.com/src/github.svg)](https://github.com/metahkg/metahkg-server)
[![License](https://img.shields.io/gitlab/license/metahkg/metahkg-server)](https://gitlab.com/metahkg/metahkg-server/-/tree/master/LICENSE.md)

[![DeepSource](https://deepsource.io/gh/metahkg/metahkg-server.svg/?label=active+issues&show_trend=true&token=U57K3_mzxKK3THb0RtJifA_R)](https://deepsource.io/gh/metahkg/metahkg-server/?ref=repository-badge)
[![DeepSource](https://deepsource.io/gh/metahkg/metahkg-server.svg/?label=resolved+issues&show_trend=true&token=U57K3_mzxKK3THb0RtJifA_R)](https://deepsource.io/gh/metahkg/metahkg-server/?ref=repository-badge)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/7a8bdd4a758c4338abe5d1d5d497a5d4)](https://www.codacy.com/gl/metahkg/metahkg-server/dashboard?utm_source=gitlab.com&utm_medium=referral&utm_content=metahkg/metahkg-server&utm_campaign=Badge_Grade)

## Deploying

### Docker

[Docs](https://docs.metahkg.org/docs/category/deploy-metahkg)

## OpenApi specification

-   [current version (in this branch)](./openapi.yaml)
-   [master](https://gitlab.com/metahkg/metahkg-server/-/blob/master/openapi.yaml)
-   [dev](https://gitlab.com/metahkg/metahkg-server/-/blob/dev/openapi.yaml)

For archives, see [openapi spec](https://gitlab.com/metahkg/openapi-spec).

## Api docs

See [api](https://docs.metahkg.org/docs/category/api) in [metahkg docs](https://docs.metahkg.org).

## Use as module

### Install

```bash
yarn add @metahkg/server
```

### Usage

```typescript
import MetahkgServer from "@metahkg/server";

(async () => {
    await client.connect();
    await setup();

    const app = await MetahkgServer();

    /**
     * The port can be modified in .env
     */
    await app.listen(3000, "0.0.0.0", (err: Error) => {
        if (err) console.log(err);
        console.log(`listening at port ${process.env.port || 3000}`);
    });
})();
```
