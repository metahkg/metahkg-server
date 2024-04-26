# Copyright (C) 2022-present Wong Chun Yat (wcyat)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

FROM node:18-alpine AS build

WORKDIR /app

ARG env
ENV env $env

COPY ./package.json ./yarn.lock ./tsconfig.json ./tsconfig.build.json ./

RUN chown -Rf node:node /app

USER node

RUN yarn install --frozen-lockfile --network-timeout 1000000

COPY ./src ./src

RUN if [ "${env}" = "dev" ]; then mkdir -p dist; else yarn build; fi;

RUN if [ "${env}" != "dev" ]; then yarn install --production --frozen-lockfile --network-timeout 1000000; fi;

FROM node:18-alpine

ARG env
ENV env $env

WORKDIR /app

COPY ./package.json ./yarn.lock ./tsconfig.json ./tsconfig.build.json ./

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

RUN chown node:node /app

USER node

EXPOSE 3000

CMD if [ "${env}" = "dev" ]; then yarn dev; else yarn start; fi;
