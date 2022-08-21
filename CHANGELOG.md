# Changelog

## v4.4.0

- emotion users
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
