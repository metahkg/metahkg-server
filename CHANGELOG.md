# Changelog

## v6.3.0

### Features

- e4b4d50: configure visibility
- 423fea9: whitelist email domains for registration ([src/routes/auth/register.ts](src/routes/auth/register.ts))

### Improvements

- e15cdf5: use preParsing for hooks where possible
- a94f5ad: use the metahkg db for agenda ([src/lib/agenda.ts](src/lib/agenda.ts))
- d3b466a: add key prefix to redis, improve redis performance, and use a password for redis only if provided ([src/lib/redis.ts](src/lib/redis.ts))
- 466adb80: send the message for validation errors ([src/app.ts](src/app.ts))

### Fixes

- 1966193: fixed agenda `updateVerificationCode` ([src/lib/agenda.ts](src/lib/agenda.ts))

## v6.2.0

### Features

- 24a1e56: optionally use redis for rate limiting ([src/app.ts](src/app.ts))

### Improvements

- 59f5c24: security: increase length of verification codes & refresh token to 60 (=30 bytes) ([src/lib/schemas.ts](src/lib/schemas.ts))

### Fixes

- 45cd72a: openapi: fixed incorrect path / operationId for `authSessionRefresh` ([openapi.yaml](openapi.yaml))
- 1ccb389: openapi: use operationId instead of path to reference operations ([openapi.yml](openapi.yaml))
- bab89e5: ci: run tagging only if package.json changed ([.gitlab-ci.yaml`](.gitlab-ci.yaml))
- 48f8ea1: config: fix `MONGO_URI` compatibility ([src/lib/config.ts](src/lib/config.ts))

## v6.1.1

- update verification code: changed to updateMany
- no longer schedule runs for updateVerificationCode after register / forgot password
  - replaced by checking and updating every 5 minutes

## v6.1.0

- removed `userId` field from request body of `/auth/sessions/{id}/refresh` (src/routes/sessions/session/refresh.ts)

## v6.0.0

> **WARNING**: Braking changes (routes and db, migration not needed)\
> You should re-configure your environmental variables (see other changes)\
> All previous sessions will be invalid after this update (see auth)

### Routes

- auth-related routes are now all under `/auth` (src/auth, src/users, src/me)
  - many routes under `/users` and `/me` are now in `/auth` (see openapi.yaml)
  - including:
    - everything under `/users` except `/users/{id}`
    - /me/session --> /me/session
    - /me/sessions --> /auth/sessions
    - /me/logout --> /auth/logout
- added: `/auth/sessions/{id}/refresh` (see auth changes)
- added: `/server/publickey` to retrieve the public key of the server (see auth changes)

### Security

- added rate limit for several routes
  - src/routes/me/blocked
  - src/routes/me/following
  - src/routes/me/starred
  - src/routes/users/user/avatar/upload.ts
- for `/me`, added `requireAuth` hook at the root to replace `if (!user)` lines

### Auth

- query db for user identity reduced from three times to once per request
  - check for banned put into `trusted` (src/app.ts)
  - updateToken hook removed (src/app.ts)
  - added a check for if every field in jwt data is the same as in that in db, if not the token would be considered invalid (src/app.ts)
- removed the `token` response header (src/users/user/actions/edit.ts)
- refreshToken hook removed (src/app.ts)
- added refresh token to be sent alongside token upon login and `/auth/sessions/{id}/refresh` for refreshing a session in 7 days after expiry / before expiry (src/auth/sessions/session/refresh.ts)
- not to extend the expiry time for an updated token (src/users/user/actions/edit.ts)
- use a set of `ed25519` keys for signing and verifying JWTs (algorithm changed to `EdDSA`) (src/app.ts)
  - as a result, all previous sessions are invalidated
  - keys are automatically generated at runtime if do not exist (src/scripts/certs.ts)
  - added `/server/publickey` to retrieve the server public key (src/routes/server/publickey.ts)

### Other changes

- replaced some `console` calls with `fastify.log`
- added `src/lib/config.ts` to replace `process.env` calls
- env variables renamed to be more standardized (temp.env)
  - compatibility with previous naming (using config.ts)
- added `KEY_PASSPHRASE` environment variable (temp.env)
- docker: use `node` as the user (Dockerfile)

## v5.10.0

- resetting password would now revoke all sessions

## v5.9.0

- `/users/reset` and `/users/verify` now require recaptcha
- `/users/reset` now supports `sameIp`
- better rate limit configurations

## v5.8.0

- `/users/login` now requires recaptcha
- fixed rate limit for `/users/forgot` and `/users/resend`

## v5.7.2

- fixed rate limit on certain paths (use `config` instead of `preHandler`)
- removed `limitCl` in favor of using `@fastify/rate-limit` with custom `keyGenerator` for those paths
- emails in `verificationCl` are now hashed

## v5.7.1

- send notifications to users following the op upon thread creation

## v5.7.0

- follow, unfollow, following (users)
- use @fastify/jwt for authentication, instead of using jsonwebtoken (only done twice, so should be faster)

## v5.6.1

- resolve [issue #2](https://gitlab.com/metahkg/metahkg-server/-/issues/2) by implementing stricter schemas

## v5.6.0

- delete avatar
- push notifications on 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000 upvotes
- admin: ban and unban users

## v5.5.1

- add threadId and commentId properties to Notification

## v5.5.0

- implement push notifications backend
- send push notifications on:
  - emotions
  - comments (on starred threads or threads created by the user)
  - replies

## v5.4.0

- revoke sessions
- get individual sessions
- logout

## v5.3.0

- add statusCode to errors

## v5.2.1

- openapi: disable additional properties

## v5.2.0

- implement sessions
- option to restrict a session to same ip
- remove `/me/status` in favor of `/me/session`
- change all `pwd` to `password`

## v5.1.0

- remove `POST /me/rename`
- move `POST /me/avatar` to `PUT /users/{id}/avatar`
- return 404 error if avatar not found

## v5.0.0

- redesign rest api (reduce redundancy and more rest)
  - merge /user to /users
  - merge /thread to /threads
  - move /category to /categories
  - no longer use `POST /create`, instead `POST /`

## v4.8.0

- move pin and unpin to `PUT` and `DELETE` `/thread/{id}/pin`

## v4.7.0

- move some put requests to patch requests to more comply with standards
- deprecate `POST /me/rename` in favor of `PATCH /user/{id}`
- pin / unpin should be post not put

## v4.6.0

- schedule tasks with agenda
- move deleted documents to removed collection (store admin info and reasoning)
- enhanced edit of thread / comment (store the admin info and reasoning for each edit)
- enhanced mute user and added optional expiration

## v4.5.0

- admin api

## v4.4.0

- get emotion users
- get emotions and votes directly (no longer need to refetch the whole comment)

## v4.3.0

- allow any emoji for emotions

## v4.2.0

- move get thread votes to /me/votes/thread/{id}

## v4.1.0

- move block and unblock to /user/{id}/block and /user/{id}/unblock
- add date and reason to block
- add star and unstar threads
- add starred
- rootless docker

## v4.0.0

- separate originally /menu route to category threads (`/category/{id}/threads`), user threads (`/user/{id}/threads`), threads (`/threads`), and search (`/threads/search`)
- remove all bytid syntax
- add `/thread/{id}/category` for getting the category of a thread
- move avatar, name, profile from `/users` to `/user`

## v3.5.0

- emotions (alpha)

## v3.4.0

- separate nameonly from profile to `/users/{id}/name`
- move profile to `/users/{id}`
- move get avatar to `/users/{id}/avatar`
- status only return active or not

## v3.3.0

- filter out and disallow access through images or comment to hidden threads for not-logged-in users

## v3.2.0

- use array to store votes in each thread

## v3.1.0

- images list in comments
- use `src` instead of `image` for image source url
- rename vote to score

## v3.0.0rc2

- use blocked instead of blocklist

## v3.0.0rc1

- largely redesigned the api
- remove images collection and merge it into thread collection
- split /users path into /users and /me
- move pin and unpin into /thread/{id}/comment/{cid}
- /categories for categories, and /category/{id} for category
- many other path changes

## v2.8.0

- use `/thread/:id/comment/:cid` for vote so as to unify the API

## v2.7.2

- add more errors if comment removed
- filter out removed comments in replies

## v2.7.1

- error if comment removed
- filter unwanted fileds ("U", "D", "replies") from pin and quote

## v2.7.0

- add limit option to menu and thread

## v2.6.0

- blocklist sends the blocked users' info not just ids

## v2.5.3

- remove support for i, please only use img
- add aspect ratio to images

## v2.5.2

- remove transform image in html sanitize which causes issues on the frontend

## v2.5.0

- support time, score, and latest for sorting comments

## v2.4.0

- profile no longer support self
- block and unblock no longer return the list of blocked users
- added blocklist to get blocked users

## v2.3.0

- use nestjs
- express no longer needed; migrated all express code to fastify.
- replace signupmode with register (process.env.register)
- split reset into forgot and reset
- status no longer sends a token, instead a token is added to the header upon request when the token has been issued for more than two days

## v2.2.0

- add rate limiting
- replace editprofile with rename

## v2.1.0

- deprecate viral collection in favor of aggregation

## v2.0.0

- migrate to fastify, reorganize paths
