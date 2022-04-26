# Deploying Metahkg (server)

## Docker

It is recommended to use docker for deployment (also supports hot reload).

Docs:

-   master branch [master.docs.metahkg.org/docker](https://master.docs.metahkg.org/docker)
-   dev branch [dev.docs.metahkg.org/docker](https://dev.docs.metahkg.org/docker)

## Manually

**_WARNING:_** This is NOT RECOMMENDED and might be OUTDATED!

### Prerequisites

-   x86_64 debian linux (only tested on ubuntu)
-   mongodb (either locally or remotely)
-   mailgun key (for sending emails, obviously)
-   recaptcha site key and secret pair (for anti-spamming)

### Set up

#### Mongodb

```bash
$ mongoimport -d=metahkg templates/server/category.json
$ mongosh
test> use metahkg
metahkg> db.viral.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 172800 })
metahkg> db.thread.createIndex({ "op": "text", "title": "text" }) //for text search
metahkg> use metahkg
metahkg> db.limit.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 })
metahkg> db.verification.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 604800 })
metahkg> exit
```

To use authentication:

```bash
$ mongosh
test> use admin
admin> db.createUser({ user: "<username>", pwd: "<password>", roles: [ "root", "userAdminAnyDatabase" ])
admin> use metahkg
metahkg> db.createUser({ user: "<username>", pwd: "<password>", roles: [ { role: "readWrite", db: "metahkg" } ] })
metahkg> use metahkg
metahkg> db.createUser({ user: "<username>", pwd: "<password>", roles: [ { role: "readWrite", db: "metahkg" } ] })
```

and then use `mongod --auth --bind_ip_all`

#### Environmental variables

```bash
cp templates/template.env .env
```

Then edit values in the .env file.

### Deploying backend

```bash
# run at the repository root
yarn install
yarn run start
```

You must need a domain. If you don't have one and deploys it locally only,
use `metahkg.test.wcyat.me` which points to localhost. Config nginx to do this
(proxy_pass <http://localhost:$port>).
