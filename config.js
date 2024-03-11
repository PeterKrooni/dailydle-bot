import * as dotenv from 'dotenv'

const requiredEnvVars = ['DISCORD_OAUTH_CLIENT_ID', 'DISCORD_BOT_TOKEN', 'MONGODB_CONNECTION_STRING']

/**
 * Load environment variables from .env file and verify that all
 * required environment variables are set.
 */
export function checkRequiredEnvVars() {
  dotenv.config()

  const missingEnvVars = requiredEnvVars.filter((envVar) => !(envVar in process.env))

  if (missingEnvVars.length > 0) {
    console.error("Missing required environment variables:", missingEnvVars)
    process.exit(1)
  }
}

/**
 * Check if the bot is allowed to interact with the given channel.
 *
 * If the environment variable ALLOWED_CHANNELS is set, the bot will only
 * interact with channels whose IDs are included in the list.
 *
 * @param {String} channelId - The ID of the channel to check.
 * @returns {boolean} True if the bot is allowed to interact with the channel, false otherwise.
 */
export function isAllowedChannel(channelId) {
  if (process.env.ALLOWED_CHANNELS === undefined) {
    return true
  }

  return process.env.ALLOWED_CHANNELS.split(',')
    .map((channelId) => channelId.trim())
    .includes(channelId)
}
