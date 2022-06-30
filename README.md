# Metahkg server

This is the Metahkg backend api. For frontend, please refer to [metahkg/metahkg-web](https://gitlab.com/metahkg/metahkg-web).

stable: [metahkg.org](https://metahkg.org)

dev build (probably daily): [dev.metahkg.org](https://dev.metahkg.org)

[![React](https://badges.aleen42.com/src/react.svg)](http://reactjs.org/)
[![Nodejs](https://badges.aleen42.com/src/node.svg)](https://nodejs.org)
[![Typescript](https://badges.aleen42.com/src/typescript.svg)](https://www.typescriptlang.org/)

[![Gitlab](https://badges.aleen42.com/src/gitlab.svg)](https://gitlab.com/metahkg/metahkg-server)
[![Github](https://badges.aleen42.com/src/github.svg)](https://github.com/metahkg/metahkg-server)
[![GitHub license](https://img.shields.io/github/license/metahkg/metahkg-server)](https://github.com/metahkg/metahkg-server/blob/master/LICENSE)

[![DeepSource](https://deepsource.io/gh/metahkg/metahkg-server.svg/?label=active+issues&show_trend=true&token=U57K3_mzxKK3THb0RtJifA_R)](https://deepsource.io/gh/metahkg/metahkg-server/?ref=repository-badge)
[![DeepSource](https://deepsource.io/gh/metahkg/metahkg-server.svg/?label=resolved+issues&show_trend=true&token=U57K3_mzxKK3THb0RtJifA_R)](https://deepsource.io/gh/metahkg/metahkg-server/?ref=repository-badge)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/7a8bdd4a758c4338abe5d1d5d497a5d4)](https://www.codacy.com/gl/metahkg/metahkg-server/dashboard?utm_source=gitlab.com&amp;utm_medium=referral&amp;utm_content=metahkg/metahkg-server&amp;utm_campaign=Badge_Grade)

## About

This open-source project was created primarily because of me being unable to register a lihkg account as a high school student.

Currently, it aims to be a fully featured alternative to lihkg. However, I might also add other useful features.

As contrasted with lihkg, metahkg is open to everyone and anyone can create an account with a email address, no matter issued by a university or not.

## Deploying

### Docker

It is recommended to use docker for deployment (also supports hot reload).

Docs:

- master branch [master.docs.metahkg.org/docker](https://master.docs.metahkg.org/docker)
- dev branch [dev.docs.metahkg.org/docker](https://dev.docs.metahkg.org/docker)

### Manually

**_WARNING:_** This is NOT RECOMMENDED and might be OUTDATED!

For manual deployment, see DEPLOY.md.

## Use as module

### Install

```bash
yarn add metahkg-server
```

### Usage

```typescript
import MetahkgServer from "metahkg-server";

(async () => {
    await client.connect();
    await setup();

    const app = await MetahkgServer();

    /**
     * The port can be modified in .env
     */
    await app.listen(3000, "0.0.0.0", (err: Error) => {
        if (err) console.log(err);
        console.log(`listening at port ${process.env.port || 3200}`);
    });
})();
```

## quick start for dev

ensure you have .env in root and have docker installed.

docker-compose -f docker-compose-dev.yml up --build
