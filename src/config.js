import * as dotenv from 'dotenv'
import winston from 'winston'

const requiredEnvVars = ['DISCORD_OAUTH_CLIENT_ID', 'DISCORD_BOT_TOKEN', 'MONGODB_CONNECTION_STRING']

/**
 * Load environment variables from .env file and verify that all
 * required environment variables are set.
 */
export function checkRequiredEnvVars() {
  dotenv.config()

  const missingEnvVars = requiredEnvVars.filter((envVar) => !(envVar in process.env))

  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars)
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
    .map(c => c.trim())
    .includes(channelId)
}

/**
 * Initializes formatted logging and overwrites the `console.log` functions, to actually
 * meaningfully differentiate between `console.info`, `console.warn`, etc.
 *
 * @param {String} [log_level] - The log level to use for the logger. Defaults to 'info'.
 */
export function initLogging(log_level) {
  const logger = winston.createLogger({
    level: log_level || 'info',
    format: winston.format.combine(winston.format.cli()),
    transports: [new winston.transports.Console()],
  })

  // console.log = (...args) => logger.info.call(logger, ...args)
  console.info = (...args) => logger.info.call(logger, ...args)
  console.warn = (...args) => logger.warn.call(logger, ...args)
  console.error = (...args) => logger.error.call(logger, ...args)
  console.debug = (...args) => logger.debug.call(logger, ...args)
}
