FROM node:20-alpine
WORKDIR /app
COPY . .

RUN npm install

ENTRYPOINT [ "npm", "start" ]
