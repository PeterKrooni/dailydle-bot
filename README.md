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

![heh](https://preview.redd.it/gpmdbeztdsjc1.jpeg?width=1170&format=pjpg&auto=webp&s=f450cabd2af040ae594d285747e96c4863809048)
