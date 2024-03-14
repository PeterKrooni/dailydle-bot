FROM node:20-alpine

WORKDIR /usr/app
COPY . .

RUN npm install

ENTRYPOINT [ "npm", "start" ]
