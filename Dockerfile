FROM node:latest AS build

WORKDIR /usr/src/app

ARG env
ENV env $env

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./

COPY . ./

RUN yarn install
RUN if [ "${env}" = "dev" ]; then mkdir -p dist; else yarn build; fi;

FROM node:latest

WORKDIR /usr/src/app

COPY ./package.json .
COPY ./yarn.lock .
COPY ./start.js .
ADD ./static ./static
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

RUN yarn install

CMD touch .env && if [ ${env} = "dev" ]; then node start.js; npx nodemon src/server.ts; else yarn run start; fi;
