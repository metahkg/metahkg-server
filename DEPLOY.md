# Deploying Metahkg (server)

## Docker

It is recommended to use docker for deployment (also supports hot reload).

[Docs](https://docs.metahkg.org/docs/category/deploy-metahkg)

## Manually

**_WARNING:_** This is NOT RECOMMENDED and might be OUTDATED!

### Prerequisites

- x86_64 debian linux (only tested on ubuntu)
- mongodb (either locally or remotely)
- mailgun key (for sending emails, obviously)
- recaptcha site key and secret pair (for anti-spamming)

### Set up mongodb

To use authentication:

```bash
$ mongosh
test> use admin
admin> db.createUser({ user: "<username>", pwd: "<password>", roles: [ "root", "userAdminAnyDatabase" ]})
admin> use metahkg
metahkg> db.createUser({ user: "<username>", pwd: "<password>", roles: [ { role: "readWrite", db: "metahkg" } ] })
metahkg> use metahkg
metahkg> db.createUser({ user: "<username>", pwd: "<password>", roles: [ { role: "readWrite", db: "metahkg" } ] })
```

and then use `mongod --auth --bind_ip_all`

#### Environmental variables

```bash
cp temp.env .env
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
