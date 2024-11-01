## About

A discord bot to keep track of daily games.
Written in TypeScript with Node, with MongoDB as the database.

## General

`src/app.ts` is the entrypoint of the application.

### Configuration
 
 
.env

```ini
# Required
DISCORD_BOT_TOKEN=<your bot token>
DATABASE_URI=<MongoDB URI>
DISCORD_ENABLED_CHANNEL_IDS=<Comma seperated list of channels to monitor>
DISCORD_APPLICATION_ID=<your bot application ID>

# Optional
BOT_ADMIN_DISCORD_USER_ID=<Discord UserID of bot admin (for running privileged commands)>
```

### Deployment & hosting

#### App

Host the application on a managed node provider of your choice, e.g. [Render](https://render.com/), [Vercel](https://vercel.com/) or similar. Can also be deployed as a docker container.

#### Database

Use a managed solution sucha as [MongoDB cloud atlas](https://www.mongodb.com/cloud/atlas/register) or deploy as a docker container.

## How to run

### Native

Use `npm install` to install depdendecies.
Use `npm start` run the bot.

### Docker

Use `docker compose up` to start bot and database as docker containers.

## Requirements

- Node
- Docker (optional)

## Kinda mid

Jakob Snorrason

## Important

![GOGOGAGA](https://preview.redd.it/0za8b7dxvjjc1.png?auto=webp&s=d9a37170213f061f85092018180fec1ae978c603)
![oiwhjef](https://preview.redd.it/y695104kc2kc1.jpeg?auto=webp&s=d5c3fbc971b3dffa7d6e98175552a0b769b59abe)
![doseprig](https://preview.redd.it/5b5vnwrqw7ic1.jpeg?auto=webp&s=967571fcd4820526b1aab7a791b8645f43b6eee0)
![aaaa](https://preview.redd.it/4h20trvx6rjc1.jpeg?auto=webp&s=5efa36a08d5aed6e50948c13ca4e68a15097aa60)
![alt text](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpqco1WRNZ8asCn0qcNHARzEAjGltEeC0_LuRR0qaQQw&s)
![heh](https://preview.redd.it/gpmdbeztdsjc1.jpeg?width=1170&format=pjpg&auto=webp&s=f450cabd2af040ae594d285747e96c4863809048)
