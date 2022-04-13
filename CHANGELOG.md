# Changelog

This changelog records changes after v0.5.1.

## v0.5.2dev

- use boolean instead of male/female to store sex
- please migrate your database before upgrading :

```bash
node server/migrate/migratetov0.5.2.js
```

## v0.5.2dev-patch1

- patch profile not being able to display sex

## v0.5.2dev1

- minor changes to api
- patch thread creation

## v0.5.2dev2

- adopt a more modern design for menu thread

## v0.5.2dev3

- use "now" for time less than a minute

## v0.5.2dev4

- menu thread changes color on hover

## v0.5.3rc1

- menu thread use a lighter color if selected
- add user name to profile user information

## v0.5.3rc2

- general changes
- fixed avatar bug

## v0.5.3rc3

- use M/F for sex and U/D for vote
- decomplicate conversation
- security fix (avatar)
- improve signin / register page (visual)
- Metahkg logo as an element

## v0.5.3rc4

- minor improvements
- forbid the use of emails as a username
- check password strength

## v0.5.5rc2

- neccessary changes for metahkg-web v0.5.5rc2

## v0.5.6rc1

- no longer redirects the users after avatar upload

## v0.5.6rc2

- support account verification in one week
- support resend verification email

## v0.5.6rc3

- support fetching an array of threads info

## v0.5.7rc1

- use one main connection for mongodb to reduce load time

## v0.5.8rc1

- support images

## v0.5.8rc2

- change username / sex
- hidden categories

## v0.5.9rc1

- implement jwt (jsonwebtoken)

## v0.5.9rc2

- simplify thread request
