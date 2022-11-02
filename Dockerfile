FROM node:18-alpine AS build

WORKDIR /usr/src/app

ARG env
ENV env $env

COPY ./package.json ./yarn.lock ./tsconfig.json ./tsconfig.build.json ./

RUN yarn install

COPY ./src ./src

RUN if [ "${env}" = "dev" ]; then mkdir -p dist; else yarn build; fi;

FROM node:18-alpine

ARG env
ENV env $env

RUN adduser user -D
WORKDIR /home/user

COPY ./package.json ./yarn.lock ./tsconfig.json ./tsconfig.build.json ./start.js ./

COPY --from=build /usr/src/app/dist ./dist

RUN if [ "${env}" = "dev" ]; then yarn install; else yarn install --production; fi;

RUN touch .env && mkdir images && chown user:user -R images .env

CMD chown user:user -R images && su user -c 'if [ "${env}" = "dev" ]; then yarn dev; else yarn start; fi;'
