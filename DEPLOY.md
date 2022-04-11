# Deploying Metahkg

## Prerequisites

- x86_64 debian linux (only tested on ubuntu)
- mongodb (either locally or remotely)
- mailgun key (for sending emails, obviously)
- recaptcha site key and secret pair (for anti-spamming)

## Set up

Run `./setup.sh` for a fast setup. It will install all the dependencies for you.
However, you will still need to configure the env variables.
Alternatively, use the following step-by-step guide. It assumes that you have installed all the dependencies.

### Mongodb

```bash
$ mongoimport -d=metahkg-threads templates/server/category.json
$ mongosh
test> use metahkg-threads
metahkg-threads> db.hottest.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 172800 })
metahkg-threads> db.summary.createIndex({ "op": "text", "title": "text" }) //for text search
metahkg-threads> use metahkg-users
metahkg-users> db.limit.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 })
metahkg-users> db.verification.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 604800 })
metahkg-users> exit
```

To use authentication:

```bash
$ mongosh
test> use admin
admin> db.createUser({ user: "<username>", pwd: "<password>", roles: [ "root", "userAdminAnyDatabase" ])
admin> use metahkg-threads
metahkg-threads> db.createUser({ user: "<username>", pwd: "<password>", roles: [ { role: "readWrite", db: "metahkg-threads" } ] })
metahkg-threads> use metahkg-users
metahkg-users> db.createUser({ user: "<username>", pwd: "<password>", roles: [ { role: "readWrite", db: "metahkg-users" } ] })
```

and then use `mongod --auth --bind_ip_all`

### Environmental variables

```bash
cp templates/template.env .env
```

Then edit values in the .env file.

## Deploying backend

```bash
# run at the repository root
yarn install
yarn run start
```

You must need a domain. If you don't have one and deploys it locally only,
use metahkg.test.wcyat.me which points to localhost. Config nginx to do this
(proxy_pass <http://localhost:(the> port you choose in .env)).
