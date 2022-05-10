FROM node:18 AS build

WORKDIR /usr/src/app

ENTRYPOINT ["sh","test_container.sh"]
#ENTRYPOINT ["tail","-f","/dev/null"]


