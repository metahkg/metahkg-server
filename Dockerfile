# Copyright (C) 2022-present Metahkg Contributors
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

COPY ./package.json ./yarn.lock ./tsconfig.json ./tsconfig.build.json ./

COPY --from=build /usr/src/app/dist ./dist

RUN if [ "${env}" = "dev" ]; then yarn install; else yarn install --production; fi;

RUN touch .env && mkdir images && chown user:user -R images .env

CMD chown user:user -R images && su user -c 'if [ "${env}" = "dev" ]; then yarn dev; else yarn start; fi;'
