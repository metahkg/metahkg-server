# Changelog

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
