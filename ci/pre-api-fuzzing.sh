#!/bin/sh
apk add curl nodejs npm git;
npm install -g mongosh;
mongosh "mongodb://mongodb:27017" --eval 'db.getSiblingDB("metahkg").users.insertOne({"id": 1, "createdAt": new Date(), "name": "test", "email": "221f4570c71cfc011eb99b789da9f11f6692583be390a7ced5e3e1952b4e1de8", password: "$2b$10$2NUAAt.MkSUgszKA6JpKae3NxlUFzrSgFPVIz5VjsU2MITD.ehFi.", sex: "M", role: "user"})';
curl -H 'Content-Type: application/json' -X POST http://metahkg-server:3000/api/auth/login --data-raw '{"name": "test", "password": "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"}' -o response.json;
auth=$(node -e 'const fs = require("fs"); const json = JSON.parse(fs.readFileSync("response.json", "utf-8")); const { token } = json; fs.writeFileSync("auth.json", `{ "headers": { "Authorization": "Bearer ` + token + `" } }`); console.log("Bearer " + token)');
curl -H "Authorization: $auth" http://metahkg-server:3000/api/auth/session;
