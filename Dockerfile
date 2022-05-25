FROM node:18-alpine AS build

WORKDIR /usr/src/app

ARG env
ENV env $env

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./

RUN yarn install

COPY . ./

RUN if [ "${env}" = "dev" ]; then mkdir -p dist; else yarn build; fi;

FROM node:18-alpine

WORKDIR /usr/src/app

COPY ./package.json .
COPY ./yarn.lock .
COPY ./tsconfig.json ./
COPY ./start.js .
COPY ./static ./static
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

CMD touch .env && if [ "${env}" = "dev" ]; then node start.js; npx nodemon src/server.ts; else yarn run start; fi;
