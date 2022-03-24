FROM node:17 AS build

WORKDIR /usr/src/app

RUN yarn add typescript

COPY package.json ./
COPY yarn.lock ./
COPY src src
COPY tsconfig.json ./

RUN yarn install
RUN yarn build

FROM node:17

WORKDIR /usr/src/app

COPY ./package.json .
COPY ./yarn.lock .
COPY ./start.js .
COPY --from=build /usr/src/app/dist ./dist

RUN yarn install

CMD yarn start