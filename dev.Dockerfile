FROM node:18-alpine AS build

WORKDIR /usr/src/app

ENTRYPOINT ["sh","test_container.sh"]
#ENTRYPOINT ["tail","-f","/dev/null"]


